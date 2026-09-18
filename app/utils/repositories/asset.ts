import type {
  Asset,
  AssetCreate,
  AssetRelocate,
  AssetsBackend,
  AssetUpdate,
  AssetApiOptions,
  BatchQueryResult,
  Folder,
  FolderCreate,
  FolderUpdate,
  FolderDeleteAssets,
  UploadCompleteResponse,
  UploadCompleteResult,
  UploadTicketFile,
  UploadTicketResponse,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import {
  assetEndpoints,
  contentTypeForUpload,
  MAX_FILE_BYTES,
  MAX_FILES_PER_TICKET,
  MAX_TICKET_BYTES,
} from '#shared/utils/asset';
import { ENTITIES } from '#shared/utils/entities';
import { entityRepo } from './entity';
import type { RepoFetchOptions } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

// Module scope, mirroring the product repo: the auto-import for `useBatchQuery`
// is only injected when it's called at the top level — calling it inside the
// factory left it undefined and crashed app init (the account store builds the
// repos on startup). Just a constant config ref, so sharing it is fine.
const { batchQueryMatchAll } = useBatchQuery();

/** One file to upload via the ticket flow, plus its optional per-file overrides. */
export interface UploadTicketItem {
  file: File;
  clientRef?: string;
  folderId?: string | null;
  name?: string;
  overwrite?: boolean;
}

/**
 * Pack items into ticket-sized batches: each batch holds ≤ MAX_FILES_PER_TICKET
 * files and ≤ MAX_TICKET_BYTES total. A claim over either cap is a 400 that would
 * fail the whole upload, so we chunk before claiming. Greedy is enough — order is
 * preserved and a single file is never split. Callers must drop per-file
 * oversize (> MAX_FILE_BYTES) first; such a file would otherwise sit alone in its
 * own batch and be rejected server-side.
 */
function chunkForTickets<T extends { file: File }>(items: T[]): T[][] {
  const batches: T[][] = [];
  let current: T[] = [];
  let currentBytes = 0;
  for (const item of items) {
    const size = item.file.size;
    if (
      current.length &&
      (current.length >= MAX_FILES_PER_TICKET ||
        currentBytes + size > MAX_TICKET_BYTES)
    ) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(item);
    currentBytes += size;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Repository for the Assets Library — full CRUD for assets plus a `folder`
 * sub-repo. Both are standard `entityRepo`s, so create/update/delete
 * auto-attach the right `errorContext` (asset / folder) for the global error
 * toast.
 *
 * The routes come from `assetEndpoints(backend)` rather than straight off the
 * registry: until the Supabase mock is retired, `NUXT_PUBLIC_ASSETS_BACKEND`
 * switches the whole library between the mock and real Geins.Media, so the same
 * build can be pointed back at the mock if the real API misbehaves. The registry
 * holds the real paths; the mock is the temporary override.
 */
export function assetRepo(
  fetch: $Fetch<unknown, NitroFetchRequest>,
  backend: AssetsBackend,
) {
  const endpoints = assetEndpoints(backend);

  const assets = entityRepo<Asset, AssetCreate, AssetUpdate, AssetApiOptions>(
    { endpoint: endpoints.asset, key: ENTITIES.asset.key },
    fetch,
  );
  const folderBase = entityRepo<Folder, FolderCreate, FolderUpdate>(
    { endpoint: endpoints.folder, key: ENTITIES.folder.key },
    fetch,
  );

  // Geins.Media lists folders at the collection root and replaces a folder with
  // PUT; `/list` + PATCH is the Management API convention the mock follows. Both
  // differences are config, so the mock's routes drop out with `assetEndpoints`.
  const folder: typeof folderBase = {
    ...folderBase,
    async list(options, fetchOptions) {
      return await fetch<Folder[]>(endpoints.folderList, {
        query: buildQueryObject(options),
        ...fetchOptions,
      });
    },
    async update(id, data, options, fetchOptions) {
      return await fetch<Folder>(`${endpoints.folder}/${id}`, {
        method: endpoints.folderUpdateMethod,
        body: data,
        query: buildQueryObject(options),
        errorContext: { action: 'updating', entity: ENTITIES.folder.key },
        ...fetchOptions,
      });
    },
  };

  return {
    ...assets,
    folder,

    /**
     * List assets via `POST /asset/query` (mirrors the real POST
     * /media/assets/query `assetQuery` schema + `BatchQueryResult` shape).
     * `all: true` is the fetch-all switch (not a huge `pageSize`, which the real
     * schema caps at 1000), so the grid + list sort / paginate / search
     * client-side via TanStack — the app-wide pattern. Folder scope goes over the
     * wire as `folderIds`: a folder id for that subtree, `null` for the library
     * root (assets with no folder), and omitted entirely for the "all assets"
     * view — so an explicit `folderId: null` is NOT the same as no options.
     * Returns the unwrapped items.
     */
    async list(
      options?: AssetApiOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      const res = await fetch<BatchQueryResult<Asset>>(
        `${endpoints.asset}/query`,
        {
          method: 'POST',
          body: {
            ...batchQueryMatchAll.value,
            ...(options && options.folderId !== undefined
              ? { folderIds: [options.folderId] }
              : {}),
          },
          ...fetchOptions,
        },
      );
      return res.items;
    },

    /**
     * Distinct, sorted tag set across all assets — feeds the tag-input
     * suggestions. Read-only; failures surface inline, not via a toast.
     */
    async listTags(fetchOptions?: RepoFetchOptions): Promise<string[]> {
      return await fetch<string[]>(`${endpoints.asset}/tags`, {
        ...fetchOptions,
      });
    },

    /**
     * Upload files via the 3-step ticket flow (mirrors Geins.Media): claim a
     * ticket, PUT each accepted file's bytes straight to its plan URL (raw
     * fetch, no auth header — like a signed storage URL), then confirm with
     * `complete`. Returns the per-file outcomes (ticket-stage rejections +
     * complete-stage results) keyed by `clientRef`. Phase-1 tickets carry no
     * metadata beyond name/folder — the caller persists description/alt text
     * with a follow-up `PATCH` on each created asset.
     *
     * Files are validated + chunked before any ticket is claimed: a file over
     * the per-file cap is rejected client-side, and the rest are packed into
     * batches within the ≤50-files / ≤10 GB ticket caps (each batch is one
     * ticket), so a large selection never trips the claim's 400.
     *
     * The bytes PUT deliberately uses the global `fetch`, not `$geinsApi`: it
     * targets the plan URL directly (a storage endpoint in production), so it
     * must not go through the API proxy. Throws on an unknown upload `mode`.
     */
    async uploadViaTickets(
      items: UploadTicketItem[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<UploadCompleteResult[]> {
      // Stamp a stable clientRef on every item up front so outcomes map back to
      // their source file across batches (and against client-side rejections).
      const stamped = items.map((it) => ({
        ...it,
        clientRef: it.clientRef ?? globalThis.crypto.randomUUID(),
      }));

      // A file over the per-file cap can't fit any ticket — reject it here
      // rather than claim a ticket that would reject it server-side anyway.
      const clientRejected: UploadCompleteResult[] = [];
      const uploadable = stamped.filter((it) => {
        if (it.file.size > MAX_FILE_BYTES) {
          clientRejected.push({
            clientRef: it.clientRef,
            status: 'rejected',
            code: 'FILE_TOO_LARGE',
            message: 'File exceeds the 1 GB limit.',
          });
          return false;
        }
        return true;
      });

      const runTicket = async (
        batch: (UploadTicketItem & { clientRef: string })[],
      ): Promise<UploadCompleteResult[]> => {
        const claims: UploadTicketFile[] = batch.map((it) => {
          const name = it.name || it.file.name;
          return {
            clientRef: it.clientRef,
            folderId: it.folderId ?? null,
            name,
            sizeBytes: it.file.size,
            mimeType: contentTypeForUpload(name, it.file.type),
            overwrite: it.overwrite ?? false,
          };
        });
        const fileByRef = new Map(batch.map((it) => [it.clientRef, it.file]));

        const ticket = await fetch<UploadTicketResponse>(endpoints.tickets, {
          method: 'POST',
          body: { files: claims },
          errorContext: { action: 'creating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        });

        const accepted = ticket.results.filter(
          (r): r is Extract<typeof r, { status: 'accepted' }> =>
            r.status === 'accepted',
        );

        await Promise.all(
          accepted.map(async (r) => {
            const mode = r.upload.mode as string;
            if (mode !== 'single')
              throw new Error(`Unsupported upload mode: ${mode}`);
            const file = fileByRef.get(r.clientRef)!;
            const contentType =
              file.type || contentTypeForUpload(file.name, undefined);
            await globalThis.fetch(r.upload.url, {
              method: 'PUT',
              body: file,
              headers: {
                'content-type': contentType,
                // Azure blob storage requires both of these alongside the body:
                // the block-blob type and the content type it should serve with.
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-blob-content-type': contentType,
              },
            });
          }),
        );

        const done = await fetch<UploadCompleteResponse>(
          `${endpoints.tickets}/${ticket.ticketId}/complete`,
          {
            method: 'POST',
            body: { files: accepted.map((r) => r.clientRef) },
            errorContext: { action: 'creating', entity: ENTITIES.asset.key },
            ...fetchOptions,
          },
        );

        const rejectedAtTicket: UploadCompleteResult[] = ticket.results
          .filter((r) => r.status === 'rejected')
          .map((r) => ({
            clientRef: r.clientRef,
            status: 'rejected',
            code: (r as Extract<typeof r, { status: 'rejected' }>).code,
            message: (r as Extract<typeof r, { status: 'rejected' }>).message,
          }));

        return [...done.results, ...rejectedAtTicket];
      };

      const batches = await Promise.all(
        chunkForTickets(uploadable).map(runTicket),
      );
      return [...batches.flat(), ...clientRejected];
    },

    /**
     * Replace an asset's underlying file (multipart) — uploads the new file and
     * repoints the row's file columns, keeping the same id + metadata. Returns
     * the updated asset.
     */
    async replace(
      id: string,
      formData: FormData,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset> {
      return await fetch<Asset>(`${endpoints.asset}/${id}/replace`, {
        method: 'POST',
        body: formData,
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Rename and/or move an asset — real `POST /media/assets/{id}/relocate`. A
     * full replace: a move sends the current `name`, a rename the current
     * `folderId`. The updated asset comes back on `200` **or** `202` (the
     * backend may settle the move asynchronously), so callers refresh the
     * library read rather than trusting the returned row to be settled.
     *
     * cutover: REMOVE@cutover — the mock has no relocate route (rename + move
     * go through its `PATCH /asset/:id`), so it falls back to `update` and its
     * wire behaviour is unchanged. Drop the branch with the mock. Ledger:
     * docs/domains/assets-cutover.md.
     */
    async relocate(
      id: string,
      data: AssetRelocate,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset> {
      if (backend === 'mock')
        return await assets.update(id, data, undefined, fetchOptions);
      return await fetch<Asset>(`${endpoints.asset}/${id}/relocate`, {
        method: 'POST',
        body: data,
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Delete a folder and its subtree, choosing what happens to the assets
     * inside via `assets`: `'move'` (default) re-homes them to uncategorised;
     * `'delete'` permanently removes them too. `folder.delete` (the plain
     * entityRepo method) still exists for the move-only default.
     */
    async deleteFolder(
      id: string,
      assets: FolderDeleteAssets = 'move',
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<null>(`${endpoints.folder}/${id}`, {
        method: 'DELETE',
        query: { assets },
        errorContext: { action: 'deleting', entity: ENTITIES.folder.key },
        ...fetchOptions,
      });
    },
  };
}
