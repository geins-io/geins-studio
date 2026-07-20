import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  ApiOptions,
} from './index';

// =============================================================================
// Assets Library types (STU-264)
//
// The API JSON contract is camelCase + `_id`/`_type` (via `ResponseEntity`),
// mirroring the Geins Management API. The Supabase mock stores snake_case
// columns and maps to this shape at the Nitro boundary (STU-266) — so these
// types are the frozen contract, independent of the storage backend.
// =============================================================================

export type AssetType =
  | 'image'
  | 'svg'
  | 'doc'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'other';

/**
 * Locale-keyed translatable text (e.g. `{ en: 'Logo', sv: 'Logotyp' }`). The
 * available locales come from the account/channel language setup, not a fixed
 * list — this feeds the global translation panel (Phase 2).
 */
export type LocalizedText = Record<string, string>;

/** Editable/creatable asset fields. Server-derived fields live on {@link Asset}. */
export interface AssetBase {
  name: string;
  type: AssetType;
  /** Folder acts as a backend category filter; `null` = uncategorised. */
  folderId: string | null;
  description?: string | null;
  altText?: LocalizedText;
  tags: string[];
  channels: string[];
}

export type AssetCreate = CreateEntity<AssetBase>;
export type AssetUpdate = UpdateEntity<AssetBase>;

/** Asset as returned by the API — base + identity + server-managed fields. */
export interface Asset extends ResponseEntity<AssetBase> {
  sizeBytes: number;
  mime: string | null;
  url: string | null;
  thumbUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Query options for listing assets — folder filter + free-text search + paging. */
export interface AssetApiOptions extends ApiOptions<keyof AssetBase> {
  folderId?: string;
  search?: string;
  page?: string;
}

// =============================================================================
// Folder (adjacency list; folder = backend category filter)
// =============================================================================

export interface FolderBase {
  name: string;
  /** Parent folder id; `null` = top-level. */
  parentId: string | null;
  sortOrder: number;
}

export type FolderCreate = CreateEntity<FolderBase>;
export type FolderUpdate = UpdateEntity<FolderBase>;

export interface Folder extends ResponseEntity<FolderBase> {
  /** Locked system folder (Uncategorised / Archived) — server-owned, not creatable. */
  system: boolean;
  createdAt: string;
}
