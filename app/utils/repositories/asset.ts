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
  };
}
