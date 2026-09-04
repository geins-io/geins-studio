import type {
  Asset,
  AssetCreate,
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
import { contentTypeForUpload } from '#shared/utils/asset';
import { ENTITIES } from '#shared/utils/entities';
import { entityRepo } from './entity';
import type { RepoFetchOptions } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

// Module scope, mirroring the product repo: the auto-import for `useBatchQuery`
// is only injected when it's called at the top level — calling it inside the
// factory left it undefined and crashed app init (the account store builds the
// repos on startup). Just two constant config refs, so sharing them is fine.
const { batchQueryMatchAll, batchQueryNoPagination } = useBatchQuery();

/**
 * Repository for the Assets Library — full CRUD for assets plus a `folder`
 * sub-repo. Both are standard `entityRepo`s off the registry, so create/update/
 * delete auto-attach the right `errorContext` (asset / folder) for the global
 * error toast. Backed by the Supabase mock today (STU-266); swaps to the real
 * Management API with no change here.
 */
export function assetRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const assets = entityRepo<Asset, AssetCreate, AssetUpdate, AssetApiOptions>(
    ENTITIES.asset,
    fetch,
  );
  const folder = entityRepo<Folder, FolderCreate, FolderUpdate>(
    ENTITIES.folder,
    fetch,
  );

  return {
    ...assets,
    folder,

    /**
     * List assets via `POST /asset/query` (mirrors the real POST
     * /media/assets/query `BatchQueryResult` shape + the product repo's batch
     * convention). Fetches everything (no-pagination batch) so the grid + list
     * sort / paginate / search client-side via TanStack — the app-wide pattern.
     * Folder scope stays server-side. Returns the unwrapped items.
     */
    async list(
      options?: AssetApiOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      const res = await fetch<BatchQueryResult<Asset>>(
        `${ENTITIES.asset.endpoint}/query`,
        {
          method: 'POST',
          body: {
            ...batchQueryMatchAll.value,
            ...batchQueryNoPagination.value,
            ...(options?.folderId ? { folderId: options.folderId } : {}),
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
      return await fetch<string[]>(`${ENTITIES.asset.endpoint}/tags`, {
        ...fetchOptions,
      });
    },

    /**
     * Upload files (multipart) — stores each in Supabase storage and creates
     * its asset row, returning the created assets. `formData` carries the
     * file(s) and optional fields (e.g. `folderId`).
     */
    async upload(
      formData: FormData,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      return await fetch<Asset[]>(`${ENTITIES.asset.endpoint}/upload`, {
        method: 'POST',
        body: formData,
        errorContext: { action: 'creating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Upload files via the 3-step ticket flow (mirrors Geins.Media): claim a
     * ticket, PUT each accepted file's bytes straight to its plan URL (raw
     * fetch, no auth header — like a signed storage URL), then confirm with
     * `complete`. Returns the per-file outcomes (ticket-stage rejections +
     * complete-stage results) keyed by `clientRef`. Phase-1 carries no metadata.
     *
     * The bytes PUT deliberately uses the global `fetch`, not `$geinsApi`: it
     * targets the plan URL directly (a storage endpoint in production), so it
     * must not go through the API proxy. Throws on an unknown upload `mode`.
     */
    async uploadViaTickets(
      items: {
        file: File;
        clientRef?: string;
        folderId?: string | null;
        name?: string;
        overwrite?: boolean;
      }[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<UploadCompleteResult[]> {
      const claims: UploadTicketFile[] = items.map((it) => {
        const name = it.name || it.file.name;
        return {
          clientRef: it.clientRef ?? globalThis.crypto.randomUUID(),
          folderId: it.folderId ?? null,
          name,
          sizeBytes: it.file.size,
          mimeType: contentTypeForUpload(name, it.file.type),
          overwrite: it.overwrite ?? false,
        };
      });
      const fileByRef = new Map(
        claims.map((claim, i) => [claim.clientRef, items[i]!.file]),
      );

      const ticket = await fetch<UploadTicketResponse>(
        `${ENTITIES.asset.endpoint}/tickets`,
        {
          method: 'POST',
          body: { files: claims },
          errorContext: { action: 'creating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        },
      );

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
              // Azure blob storage requires this alongside content-type.
              'x-ms-blob-content-type': contentType,
            },
          });
        }),
      );

      const done = await fetch<UploadCompleteResponse>(
        `${ENTITIES.asset.endpoint}/tickets/${ticket.ticketId}/complete`,
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
      return await fetch<Asset>(`${ENTITIES.asset.endpoint}/${id}/replace`, {
        method: 'POST',
        body: formData,
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
      await fetch<null>(`${ENTITIES.folder.endpoint}/${id}`, {
        method: 'DELETE',
        query: { assets },
        errorContext: { action: 'deleting', entity: ENTITIES.folder.key },
        ...fetchOptions,
      });
    },
  };
}
