import type {
  Asset,
  AssetCreate,
  AssetLink,
  AssetLinkTarget,
  AssetLocalizations,
  AssetQuery,
  AssetQueryFilters,
  AssetQueryScope,
  AssetReplace,
  AssetRelocate,
  AssetUpdate,
  AssetApiOptions,
  AssetBulkMove,
  AssetTrashPurge,
  BatchQueryResult,
  Folder,
  FolderCreate,
  FolderUpdate,
  FolderDeleteAssets,
  GeinsErrorAction,
  ListQueryRequestOptions,
  ListQueryState,
  Localized,
  UploadCompleteResponse,
  UploadCompleteResult,
  UploadTicketFile,
  UploadTicketResponse,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import {
  ASSET_QUERY_PAGE_SIZE,
  contentTypeForUpload,
  isAssetSortField,
  MAX_FILE_BYTES,
  MAX_FILES_PER_TICKET,
  MAX_TICKET_BYTES,
} from '#shared/utils/asset';
import { ENTITIES } from '#shared/utils/entities';
import { entityRepo } from './entity';
import type { RepoFetchOptions } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

/** One file to upload via the ticket flow, plus its optional per-file overrides. */
export interface UploadTicketItem {
  file: File;
  clientRef?: string;
  /**
   * `null` is the library root; leaving it out omits `folderId` from the claim,
   * which asks the backend to create the folders named by `name`'s path.
   */
  folderId?: string | null;
  name?: string;
  overwrite?: boolean;
  /** Metadata applied when the ticket completes (no follow-up write needed). */
  description?: string;
  altText?: string;
  localizations?: Localized<AssetLocalizations>;
  /** Links created when the ticket completes (max 100). */
  links?: AssetLinkTarget[];
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

/** Upload tickets are a sibling of assets on Geins.Media, not a child. */
const TICKETS_ENDPOINT = '/media/tickets';
const TRASH_ENDPOINT = '/media/trash';

/**
 * Folder / trash scope as `assetQuery` criteria. A folder id covers its subtree
 * (`includeSubfolders`); `null` is the library root only, since "descendants of
 * root" would be the whole library; omitted means every folder. `trashed: true`
 * swaps the result set for the trash (either-or), so it is only sent when set.
 */
function assetScopeCriteria(scope?: AssetQueryScope): AssetQuery {
  const folderId = scope?.folderId;
  return {
    ...(folderId !== undefined
      ? {
          folderIds: [folderId],
          ...(folderId !== null ? { includeSubfolders: true } : {}),
        }
      : {}),
    ...(scope?.trashed ? { trashed: true } : {}),
  };
}

function assetFilterCriteria(filters: AssetQueryFilters): AssetQueryFilters {
  return {
    ...(filters.assetTypes?.length ? { assetTypes: filters.assetTypes } : {}),
    ...(filters.channels?.length ? { channels: filters.channels } : {}),
    ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
    ...(filters.modifiedFrom ? { modifiedFrom: filters.modifiedFrom } : {}),
    ...(filters.modifiedTo ? { modifiedTo: filters.modifiedTo } : {}),
  };
}

/**
 * Map list state onto the `assetQuery` body. `all: true` matches every asset
 * *regardless of* the other criteria, so it is only sent when there is no
 * scope, filter or search at all. An unknown sort column is dropped (the
 * backend would 400) and the default `updatedAt desc` applies.
 */
function assetQueryBody(
  state: ListQueryState<AssetQueryFilters>,
  scope?: AssetQueryScope,
  batchId?: string,
): AssetQuery {
  const search = state.search.trim();
  const criteria: AssetQuery = {
    ...assetScopeCriteria(scope),
    ...assetFilterCriteria(state.filters),
    ...(search ? { search } : {}),
  };
  const sort = state.sort;
  return {
    ...(Object.keys(criteria).length ? criteria : { all: true }),
    ...(sort && isAssetSortField(sort.field)
      ? { sortBy: sort.field, sortDirection: sort.direction }
      : {}),
    ...(batchId ? { _id: batchId } : {}),
    page: Math.max(1, Math.floor(state.page)),
    pageSize: Math.min(
      Math.max(1, Math.floor(state.pageSize)),
      ASSET_QUERY_PAGE_SIZE,
    ),
  };
}

/**
 * Repository for the Assets Library — full CRUD for assets plus a `folder`
 * sub-repo. Both are standard `entityRepo`s, so create/update/delete
 * auto-attach the right `errorContext` (asset / folder) for the global error
 * toast.
 */
export function assetRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const assets = entityRepo<Asset, AssetCreate, AssetUpdate, AssetApiOptions>(
    ENTITIES.asset,
    fetch,
  );
  const folderBase = entityRepo<Folder, FolderCreate, FolderUpdate>(
    ENTITIES.folder,
    fetch,
  );

  // Geins.Media lists folders at the collection root and replaces a folder with
  // PUT, where `entityRepo` assumes the Management API's `{base}/list` + PATCH.
  const folder: typeof folderBase = {
    ...folderBase,
    async list(options, fetchOptions) {
      return await fetch<Folder[]>(ENTITIES.folder.endpoint, {
        query: buildQueryObject(options),
        ...fetchOptions,
      });
    },
    async update(id, data, options, fetchOptions) {
      return await fetch<Folder>(`${ENTITIES.folder.endpoint}/${id}`, {
        method: 'PUT',
        body: data,
        query: buildQueryObject(options),
        errorContext: { action: 'updating', entity: ENTITIES.folder.key },
        ...fetchOptions,
      });
    },
  };

  /**
   * Steps 2–3 of the ticket flow, for a ticket already claimed: PUT each
   * accepted file's bytes straight to its plan URL, then `complete` the
   * accepted refs (skipped when nothing was accepted). Returns the completion
   * results merged with the ticket-stage rejections. Upload and replace both
   * finish through here.
   *
   * The bytes PUT deliberately uses the global `fetch`, not `$geinsApi`: it
   * targets the plan URL directly (a storage endpoint in production), so it
   * must not go through the API proxy. Throws on an unknown upload `mode`.
   */
  async function sendTicketFiles(
    ticket: UploadTicketResponse,
    fileByRef: Map<string, File>,
    action: GeinsErrorAction,
    fetchOptions?: RepoFetchOptions,
  ): Promise<UploadCompleteResult[]> {
    const accepted = ticket.results.filter(
      (r): r is Extract<typeof r, { status: 'accepted' }> =>
        r.status === 'accepted',
    );

    const rejectedAtTicket: UploadCompleteResult[] = ticket.results
      .filter((r) => r.status === 'rejected')
      .map((r) => ({
        clientRef: r.clientRef,
        status: 'rejected',
        code: (r as Extract<typeof r, { status: 'rejected' }>).code,
        message: (r as Extract<typeof r, { status: 'rejected' }>).message,
      }));

    // Nothing accepted → skip `complete`, so a ticket-stage rejection comes back
    // as-is instead of masked by whatever an empty `complete` answers.
    if (!accepted.length) return rejectedAtTicket;

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
      `${TICKETS_ENDPOINT}/${ticket.ticketId}/complete`,
      {
        method: 'POST',
        body: { files: accepted.map((r) => r.clientRef) },
        errorContext: { action, entity: ENTITIES.asset.key },
        ...fetchOptions,
      },
    );

    return [...done.results, ...rejectedAtTicket];
  }

  return {
    ...assets,
    folder,

    /**
     * List assets via `POST /asset/query` (mirrors the real POST
     * /media/assets/query `assetQuery` schema + `BatchQueryResult` shape).
     * Returns one page at the schema's `pageSize` cap (1000), treated as the
     * whole set — the grid + list sort / paginate / search client-side via
     * TanStack, the app-wide pattern. Libraries past 1000 assets are truncated.
     *
     * `all: true` matches every asset *regardless of the other filters*, so it
     * is only sent for the unfiltered "all assets" view; the folder / trash
     * scope is built by `assetScopeCriteria`. Server-driven lists use
     * {@link query} instead.
     */
    async list(
      options?: AssetApiOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      const filters = assetScopeCriteria(options);
      const criteria = Object.keys(filters).length ? filters : { all: true };
      const res = await fetch<BatchQueryResult<Asset>>(
        `${ENTITIES.asset.endpoint}/query`,
        {
          method: 'POST',
          body: { ...criteria, page: 1, pageSize: ASSET_QUERY_PAGE_SIZE },
          ...fetchOptions,
        },
      );
      return res.items;
    },

    /**
     * One server-driven page of assets — `POST /media/assets/query` with the
     * list's page, sort, search and filters (see `assetQueryBody`). Returns the
     * full `BatchQueryResult`: pass its `_id` back as `batchId` to page the same
     * batch, and drop it whenever the query itself changes. Errors surface in
     * the list's error state; as a POST it would otherwise fire the global
     * mutation toast.
     */
    async query(
      state: ListQueryState<AssetQueryFilters>,
      scope?: AssetQueryScope,
      options?: ListQueryRequestOptions,
    ): Promise<BatchQueryResult<Asset>> {
      return await fetch<BatchQueryResult<Asset>>(
        `${ENTITIES.asset.endpoint}/query`,
        {
          method: 'POST',
          body: assetQueryBody(state, scope, options?.batchId),
          suppressErrorToast: true,
          ...(options?.signal ? { signal: options.signal } : {}),
        },
      );
    },

    /**
     * Every asset the list's query matches across all pages — for a bulk
     * "select all", so the page knows each selected asset (a bulk link's type
     * split, a zip download's url/name/size) without another fetch.
     * Pages the same batch at the 1000 cap until `pageCount`, so the result
     * stays consistent with what the list counted.
     */
    async matchingAssets(
      state: ListQueryState<AssetQueryFilters>,
      scope?: AssetQueryScope,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      const assets: Asset[] = [];
      let batchId: string | undefined;
      for (let page = 1; ; page++) {
        const res = await fetch<BatchQueryResult<Asset>>(
          `${ENTITIES.asset.endpoint}/query`,
          {
            method: 'POST',
            body: assetQueryBody(
              { ...state, page, pageSize: ASSET_QUERY_PAGE_SIZE },
              scope,
              batchId,
            ),
            suppressErrorToast: true,
            ...fetchOptions,
          },
        );
        const items = Array.isArray(res.items) ? res.items : [];
        assets.push(...items);
        batchId = res._id;
        if (!items.length || page >= res.pageCount) return assets;
      }
    },

    /**
     * Move up to 100 assets to trash — real `POST /media/assets/bulk-delete`
     * (`204`). All or nothing: one unknown id refuses the whole call with a
     * `404` listing the ids. Already-trashed ids are left alone. Chunk larger
     * selections with `runInChunks` (`#shared/utils/bulk`).
     */
    async bulkDelete(
      assetIds: string[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<unknown>(`${ENTITIES.asset.endpoint}/bulk-delete`, {
        method: 'POST',
        body: { assetIds },
        errorContext: { action: 'deleting', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Purge up to 100 trashed assets now — real `POST /media/assets/bulk-purge`
     * (`202`). Only trashed ids: a live id refuses the whole call with a `404`
     * listing the ids, so nothing skips the restore window. There is no
     * single-asset route, so purge one asset by passing one id. The purge runs
     * after the call, so a refetch can still list the assets for about a minute.
     */
    async bulkPurge(
      assetIds: string[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<AssetTrashPurge> {
      return await fetch<AssetTrashPurge>(
        `${ENTITIES.asset.endpoint}/bulk-purge`,
        {
          method: 'POST',
          body: { assetIds },
          errorContext: { action: 'deleting', entity: ENTITIES.asset.key },
          ...fetchOptions,
        },
      );
    },

    /**
     * Purge every trashed asset in the account — real `POST /media/trash/empty`
     * (`202`). The server asks for no confirmation, so the caller must. Same
     * delayed purge as `bulkPurge`.
     */
    async emptyTrash(
      fetchOptions?: RepoFetchOptions,
    ): Promise<AssetTrashPurge> {
      return await fetch<AssetTrashPurge>(`${TRASH_ENDPOINT}/empty`, {
        method: 'POST',
        errorContext: { action: 'deleting', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Move up to 100 assets into one folder — real `POST /media/assets/bulk-move`.
     * `folderId: null` is the library root. Usually `202` with a `moveId` (the
     * copies land in the background, so refresh rather than trust the list);
     * `204` (→ `null`) when every asset already sits in the folder. All or
     * nothing; a 409's problem title says which conflict refused it.
     */
    async bulkMove(
      assetIds: string[],
      folderId: string | null,
      fetchOptions?: RepoFetchOptions,
    ): Promise<AssetBulkMove | null> {
      const res = await fetch<AssetBulkMove | null | undefined>(
        `${ENTITIES.asset.endpoint}/bulk-move`,
        {
          method: 'POST',
          body: { assetIds, folderId },
          errorContext: { action: 'updating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        },
      );
      return res && typeof res === 'object' && 'moveId' in res ? res : null;
    },

    /**
     * Add tags to up to 100 assets — real `POST /media/assets/bulk-tag`. Adds to
     * each asset's set and never removes, so repeating a body is safe; a new tag
     * is created on the fly. All or nothing: a `422` names the assets that would
     * pass 100 tags.
     */
    async bulkTag(
      assetIds: string[],
      tags: string[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<unknown>(`${ENTITIES.asset.endpoint}/bulk-tag`, {
        method: 'POST',
        body: { assetIds, tags },
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Add channels to up to 100 assets — real
     * `POST /media/assets/bulk-assign-channels`. Same add-only, all-or-nothing
     * rules as {@link bulkTag}; a `422` names the assets that would pass 50.
     */
    async bulkAssignChannels(
      assetIds: string[],
      channels: string[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<unknown>(`${ENTITIES.asset.endpoint}/bulk-assign-channels`, {
        method: 'POST',
        body: { assetIds, channels },
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * The live assets with these ids — `assetIds` on `POST /media/assets/query`,
     * one page at the schema's cap. Ids that don't match (trashed, deleted) are
     * simply absent from the result.
     */
    async byIds(
      ids: string[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset[]> {
      if (!ids.length) return [];
      const res = await fetch<BatchQueryResult<Asset>>(
        `${ENTITIES.asset.endpoint}/query`,
        {
          method: 'POST',
          body: {
            assetIds: ids,
            page: 1,
            pageSize: Math.min(ids.length, ASSET_QUERY_PAGE_SIZE),
          },
          ...fetchOptions,
        },
      );
      return Array.isArray(res.items) ? res.items : [];
    },

    /**
     * What this asset is linked to outside the library — real
     * `GET /media/assets/{id}/links`. The backend resolves nothing: a link to a
     * since-deleted product still comes back, and no display name is included,
     * so the caller resolves `targetId` itself. Read-only; failures surface
     * inline, not via a toast.
     */
    async links(
      id: string,
      fetchOptions?: RepoFetchOptions,
    ): Promise<AssetLink[]> {
      const res = await fetch<AssetLink[]>(
        `${ENTITIES.asset.endpoint}/${id}/links`,
        {
          ...fetchOptions,
        },
      );
      return Array.isArray(res) ? res : [];
    },

    /**
     * Link assets to targets — real `POST /media/assets/bulk-link`. Every asset
     * gets every link (at most 100 links per call). Only adds, never removes, so
     * repeating a body is safe. All or nothing: a `productimage` link on a
     * non-image/svg asset is a `422` naming those assets.
     */
    async bulkLink(
      assetIds: string[],
      links: AssetLinkTarget[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<unknown>(`${ENTITIES.asset.endpoint}/bulk-link`, {
        method: 'POST',
        body: { assetIds, links },
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /** Remove one link — real `DELETE /media/assets/{id}/links/{type}/{target}`. */
    async removeLink(
      id: string,
      targetType: string,
      targetId: string,
      fetchOptions?: RepoFetchOptions,
    ): Promise<void> {
      await fetch<unknown>(
        `${ENTITIES.asset.endpoint}/${id}/links/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`,
        {
          method: 'DELETE',
          errorContext: { action: 'updating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        },
      );
    },

    /**
     * Distinct tags on live assets, sorted by name — real `GET media/tags`.
     * Feeds the tag-input suggestions; a tag only on trashed assets drops out.
     */
    async listTags(fetchOptions?: RepoFetchOptions): Promise<string[]> {
      const res = await fetch<string[]>('/media/tags', { ...fetchOptions });
      return Array.isArray(res) ? res : [];
    },

    /**
     * Upload files via the 3-step ticket flow (mirrors Geins.Media): claim a
     * ticket, PUT each accepted file's bytes straight to its plan URL (raw
     * fetch, no auth header — like a signed storage URL), then confirm with
     * `complete`. Returns the per-file outcomes (ticket-stage rejections +
     * complete-stage results) keyed by `clientRef`. Metadata rides the claim —
     * description / alt text / localizations / `links` are applied when the
     * ticket completes, so no follow-up `PATCH` per created asset.
     *
     * An item's `folderId` is forwarded as given (`null` = library root) and
     * omitted entirely when the item leaves it out, which is how the backend is
     * asked to create the folders named by the path in `name`.
     *
     * Files are validated + chunked before any ticket is claimed: a file over
     * the per-file cap is rejected client-side, and the rest are packed into
     * batches within the ≤50-files / ≤10 GB ticket caps (each batch is one
     * ticket), so a large selection never trips the claim's 400.
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
            ...(it.folderId !== undefined ? { folderId: it.folderId } : {}),
            name,
            sizeBytes: it.file.size,
            mimeType: contentTypeForUpload(name, it.file.type),
            overwrite: it.overwrite ?? false,
            ...(it.description ? { description: it.description } : {}),
            ...(it.altText ? { altText: it.altText } : {}),
            ...(it.localizations && Object.keys(it.localizations).length
              ? { localizations: it.localizations }
              : {}),
            ...(it.links?.length ? { links: it.links } : {}),
          };
        });
        const fileByRef = new Map(batch.map((it) => [it.clientRef, it.file]));

        const ticket = await fetch<UploadTicketResponse>(TICKETS_ENDPOINT, {
          method: 'POST',
          body: { files: claims },
          errorContext: { action: 'creating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        });

        return await sendTicketFiles(
          ticket,
          fileByRef,
          'creating',
          fetchOptions,
        );
      };

      const batches = await Promise.all(
        chunkForTickets(uploadable).map(runTicket),
      );
      return [...batches.flat(), ...clientRejected];
    },

    /**
     * Replace an asset's file in place — real `POST /media/assets/{id}/replace`
     * claims a one-file ticket (its `clientRef` and `assetId` are the asset's
     * id), then the bytes go through the same PUT + `complete` as an upload.
     * Id, path, name, texts, tags, channels and links stay; `url` (its `v`),
     * etag, size, MIME and type change, so callers refetch the asset.
     *
     * The claim itself throws on 404 (trashed / unknown), 409 (a move is
     * running) and 422 (extension isn't the asset's own, or a bad name). A
     * rejection at completion comes back as the `rejected` result, and the
     * backend restores the previous file.
     */
    async replace(
      id: string,
      file: File,
      fetchOptions?: RepoFetchOptions,
    ): Promise<UploadCompleteResult> {
      const body: AssetReplace = {
        fileName: file.name,
        sizeBytes: file.size,
        mimeType: contentTypeForUpload(file.name, file.type),
      };
      const ticket = await fetch<UploadTicketResponse>(
        `${ENTITIES.asset.endpoint}/${id}/replace`,
        {
          method: 'POST',
          body,
          errorContext: { action: 'updating', entity: ENTITIES.asset.key },
          ...fetchOptions,
        },
      );
      const fileByRef = new Map(ticket.results.map((r) => [r.clientRef, file]));
      const [result] = await sendTicketFiles(
        ticket,
        fileByRef,
        'updating',
        fetchOptions,
      );
      if (!result) throw new Error('Replace ticket returned no result');
      return result;
    },

    /**
     * Rename and/or move an asset — real `POST /media/assets/{id}/relocate`. A
     * full replace: a move sends the current `name`, a rename the current
     * `folderId`. The updated asset comes back on `200` **or** `202` (the
     * backend may settle the move asynchronously), so callers refresh the
     * library read rather than trusting the returned row to be settled.
     */
    async relocate(
      id: string,
      data: AssetRelocate,
      fetchOptions?: RepoFetchOptions,
    ): Promise<Asset> {
      return await fetch<Asset>(`${ENTITIES.asset.endpoint}/${id}/relocate`, {
        method: 'POST',
        body: data,
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * Restore a soft-deleted asset from trash — real
     * `POST /media/assets/{id}/restore`. Deleting is soft on Geins.Media (30-day
     * retention), so this is the undo. The response body is not relied on (the backend may answer `200` or `204`) — callers
     * refresh the library read instead.
     */
    async restore(id: string, fetchOptions?: RepoFetchOptions): Promise<void> {
      await fetch<unknown>(`${ENTITIES.asset.endpoint}/${id}/restore`, {
        method: 'POST',
        errorContext: { action: 'updating', entity: ENTITIES.asset.key },
        ...fetchOptions,
      });
    },

    /**
     * The trashed asset holding each `{ folderId, name }` path, or `null` when
     * none does. A trashed asset keeps its bytes at its path until purged, so
     * the ticket rejects that path with `PATH_ALREADY_EXISTS` — this tells such
     * a conflict apart from a live one. `assetName` is a substring match, so the
     * name is compared exactly (paths are case-insensitive) on the client.
     */
    async trashedAtPaths(
      paths: { folderId: string | null; name: string }[],
      fetchOptions?: RepoFetchOptions,
    ): Promise<(Asset | null)[]> {
      return await Promise.all(
        paths.map(async ({ folderId, name }) => {
          const res = await fetch<BatchQueryResult<Asset>>(
            `${ENTITIES.asset.endpoint}/query`,
            {
              method: 'POST',
              body: {
                trashed: true,
                folderIds: [folderId],
                assetName: name,
                page: 1,
                pageSize: ASSET_QUERY_PAGE_SIZE,
              },
              ...fetchOptions,
            },
          );
          const items = Array.isArray(res.items) ? res.items : [];
          const wanted = name.toLowerCase();
          return items.find((a) => a.name.toLowerCase() === wanted) ?? null;
        }),
      );
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
