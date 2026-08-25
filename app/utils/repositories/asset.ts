import type {
  Asset,
  AssetCreate,
  AssetUpdate,
  AssetApiOptions,
  Folder,
  FolderCreate,
  FolderUpdate,
  FolderDeleteAssets,
} from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { entityRepo } from './entity';
import type { RepoFetchOptions } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

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
