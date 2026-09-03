import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  ApiOptions,
  Localized,
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

/** Per-locale translatable asset fields (product-standard `localizations`). */
export interface AssetLocalizations {
  altText?: string;
}

/** Editable/creatable asset fields. Server-derived fields live on {@link Asset}. */
export interface AssetBase {
  name: string;
  type: AssetType;
  /** Folder acts as a backend category filter; `null` = uncategorised. */
  folderId: string | null;
  description?: string | null;
  /** Locale-keyed translatable fields, e.g. `{ en: { altText }, sv: { altText } }`. */
  localizations?: Localized<AssetLocalizations>;
  tags: string[];
  channels: string[];
}

export type AssetCreate = CreateEntity<AssetBase>;
export type AssetUpdate = UpdateEntity<AssetBase>;

/**
 * Per-file metadata sent alongside a multipart upload (the upload wizard). The
 * `POST /asset/upload` route reads a `meta` field — a JSON array of these, one
 * per file part, in the same order — and persists it on each created asset.
 * Everything is optional; omitted fields fall back to defaults (uncategorised,
 * empty tags/channels, filename as name).
 */
export interface AssetUploadMeta {
  name?: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
  channels?: string[];
  localizations?: Localized<AssetLocalizations>;
}

/** Asset as returned by the API — base + identity + server-managed fields. */
export interface Asset extends ResponseEntity<AssetBase> {
  /** Blob storage path: `folderPath`/`name`. Mirrors the real API's `path`. */
  path: string;
  /** Owning folder's full path (breadcrumb source); `null` for a root asset. */
  folderPath: string | null;
  /** Default-language alt text, derived server-side from `localizations`. */
  altText: string | null;
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
  /** Full path from the root to this folder, e.g. `marketing/campaigns`. */
  fullPath: string;
  /** Depth in the tree — segment count of `fullPath` (1 = top level). */
  depth: number;
  createdAt: string;
}

/**
 * What happens to the assets inside a folder (and its subtree) when the folder
 * is deleted: `move` re-homes them to uncategorised (server FK `SET NULL`);
 * `delete` permanently removes them too.
 */
export type FolderDeleteAssets = 'move' | 'delete';

// =============================================================================
// Backend capabilities
// =============================================================================

/**
 * Which Assets Library backend the client targets. `mock` is the full Supabase
 * mock; `media-phase1` is the real Geins.Media phase-1 API, which serves browse
 * + upload only (see the Phase 8 milestone).
 */
export type AssetsBackend = 'mock' | 'media-phase1';

/**
 * Feature availability per backend — the shipped UI gates on these so controls
 * the real phase-1 API can't fulfil (metadata edit, delete, replace, tag
 * autocomplete, thumbnails) disable cleanly instead of erroring, while the mock
 * keeps everything on. Derived from the backend via `assetCapabilities`.
 */
export interface AssetCapabilities {
  backend: AssetsBackend;
  /** Edit + save asset metadata (name, description, alt text, tags, channels). */
  canEditMetadata: boolean;
  /** Move an asset to another folder (change `folderId`). */
  canMoveAsset: boolean;
  canDeleteAsset: boolean;
  canReplaceFile: boolean;
  /** Suggest existing tags from the distinct-tags source. */
  tagAutocomplete: boolean;
  /** Backend produces real thumbnails (`thumbUrl`); phase 1 returns null. */
  hasThumbnails: boolean;
}
