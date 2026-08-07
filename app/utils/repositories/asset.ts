import type {
  Asset,
  AssetCreate,
  AssetUpdate,
  AssetApiOptions,
  Folder,
  FolderCreate,
  FolderUpdate,
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
  };
}
