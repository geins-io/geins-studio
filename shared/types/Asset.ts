import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  EntityBaseWithName,
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
  description?: string;
  altText?: string;
}

/** Editable/creatable asset fields. Server-derived fields live on {@link Asset}. */
export interface AssetBase {
  name: string;
  type: AssetType;
  /** Folder acts as a backend category filter; `null` = uncategorised. */
  folderId: string | null;
  /**
   * Default-language description. On a response it's derived from
   * `localizations` (like {@link Asset.altText}); the panel edits it per-locale
   * and writes it back through `localizations`, so `PATCH` sends it there, not
   * as a separate top-level field.
   */
  description?: string | null;
  /** Locale-keyed translatable fields, e.g. `{ en: { description, altText } }`. */
  localizations?: Localized<AssetLocalizations>;
  /**
   * Both are mock-only in phase 1 — a real `media_response_asset` carries
   * neither, so every read site must tolerate `undefined` (a missing array
   * blanked the grid when the first real assets landed).
   */
  tags?: string[];
  channels?: string[];
}

export type AssetCreate = CreateEntity<AssetBase>;
export type AssetUpdate = UpdateEntity<AssetBase>;

/**
 * Rename and/or move in one call — the body of `POST /media/assets/{id}/relocate`
 * (`media_request_relocateAsset`). A full replace like the folder `PUT`: a move
 * sends the current `name`, a rename the current `folderId`. `name` carries the
 * file extension and may not contain a slash; `folderId` `null` is the library
 * root.
 */
export interface AssetRelocate {
  name: string;
  folderId: string | null;
}

// =============================================================================
// Upload ticket flow (Geins.Media 3-step upload: ticket → PUT bytes → complete)
//
// Phase 1 uploads claim a ticket, PUT bytes straight to storage via a returned
// plan URL, then confirm with `complete`. No metadata rides along — the ticket
// carries only name/folder/size/mime/overwrite; richer metadata waits for the
// phase-2 metadata routes. Mock-emulated today (see server/api/asset/tickets*).
// =============================================================================

/** One file's claim in a ticket request. */
export interface UploadTicketFile {
  /** Client-generated id used to match results back to the source file. */
  clientRef: string;
  folderId?: string | null;
  /** Bare file name when `folderId` is set; may carry path segments at root. */
  name: string;
  sizeBytes: number;
  mimeType: string;
  /** Overwrite an existing asset at the path (else `PATH_ALREADY_EXISTS`). */
  overwrite?: boolean;
}

/** How to upload one accepted file's bytes. `single` now; `parts` is phase 2. */
export type UploadPlan = { mode: 'single'; url: string };

/** Per-file rejection codes the client switches on (ticket + complete). */
export type UploadRejectionCode =
  | 'PATH_INVALID'
  | 'PATH_ALREADY_EXISTS'
  | 'PATH_MOVE_PENDING'
  | 'FILE_TOO_LARGE'
  | 'FILE_TYPE_NOT_ALLOWED'
  | 'FOLDER_INVALID'
  | 'FOLDER_DEPTH_EXCEEDED'
  | 'FORBIDDEN'
  | 'QUOTA_EXCEEDED'
  | 'BLOB_MISSING'
  | 'CONTENT_TYPE_MISMATCH'
  | 'SCAN_REJECTED';

export type UploadTicketResult =
  | {
      clientRef: string;
      status: 'accepted';
      assetId: string;
      upload: UploadPlan;
    }
  | {
      clientRef: string;
      status: 'rejected';
      code: UploadRejectionCode;
      message: string;
    };

export interface UploadTicketResponse {
  ticketId: string;
  expiresAt: string;
  results: UploadTicketResult[];
}

export type UploadCompleteResult =
  | { clientRef: string; status: 'completed'; file: Asset }
  | {
      clientRef: string;
      status: 'rejected';
      code: UploadRejectionCode;
      message: string;
    };

export interface UploadCompleteResponse {
  results: UploadCompleteResult[];
}

/** Asset as returned by the API — base + identity + server-managed fields. */
export interface Asset extends ResponseEntity<AssetBase> {
  /**
   * Optimistic-concurrency tag. The real `PATCH /media/assets/{id}` requires it
   * echoed back as `If-Match: {etag}`; a stale tag yields `412`. Round-trip it
   * verbatim (opaque token) — `null` when the backend supplies none.
   */
  etag: string | null;
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

/**
 * Options for opening the asset picker — mirrors `AssetPickerPanel`'s props.
 * Every field is optional; the panel applies its own defaults (`multiple: true`,
 * `types: null` = all types, empty `preselectedIds`, default title, root folder).
 */
export interface AssetPickerOptions {
  /** Single vs multi-select. Single = a new pick replaces the selection. */
  multiple?: boolean;
  /** Allowed types. `null`/omitted = all; e.g. `['image']` = images only. */
  types?: AssetType[] | null;
  /** Already-linked asset ids — shown checked; the confirm count is NEW picks only. */
  preselectedIds?: string[];
  /** Panel heading override. */
  title?: string;
  /** Initial folder scope (server-side filter). */
  folderId?: string | null;
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
  /** Parent folder id; `null` = top-level. Named to match Geins.Media. */
  parentFolderId: string | null;
  /** Mock-only — real phase 1 has no manual ordering. REMOVE@cutover. */
  sortOrder?: number;
}

export type FolderCreate = CreateEntity<FolderBase>;

/**
 * A folder update is a **full replace**: real `PUT /media/folders/{id}` requires
 * `name` on every call, so a move sends the current name and a rename sends the
 * current `parentFolderId`. Deliberately not `UpdateEntity` (partial) — a
 * partial body would blank the other field.
 */
export type FolderUpdate = CreateEntity<FolderBase>;

export interface Folder extends ResponseEntity<FolderBase> {
  /**
   * Full path from the root to this folder, lowercased, e.g.
   * `marketing/campaigns` — the leading part of every asset path within it.
   */
  path: string;
  /** Depth in the tree — segment count of `path` (1 = top level). */
  depth: number;
  /**
   * Locked system folder (Uncategorised / Archived) — mock-only; real phase 1
   * has no system folders, so it is absent there. REMOVE@cutover.
   */
  system?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
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
 * + upload, metadata `PATCH`, `relocate` and `DELETE` (see the Phase 8
 * milestone).
 */
export type AssetsBackend = 'mock' | 'media-phase1';

/**
 * The wire routes for a given backend. The real Geins.Media surface and the
 * Supabase mock differ in more than a prefix: folders list at the collection
 * root (`GET /media/folders`) rather than the Management API's `/list`
 * convention, folder updates are a `PUT` replace, and upload tickets are a
 * sibling of assets, not a child. Derived from the backend via `assetEndpoints`.
 */
export interface AssetEndpoints {
  /** Asset collection base — `{base}/{id}` and `{base}/query` hang off it. */
  asset: string;
  /** Folder collection base — `{base}/{id}` for get/update/delete. */
  folder: string;
  /** Folder list route (real: the collection root; mock: `/list`). */
  folderList: string;
  /** Verb for a folder update — the real API replaces, the mock patches. */
  folderUpdateMethod: 'PATCH' | 'PUT';
  /** Upload-ticket base — `{base}/{ticketId}/complete` hangs off it. */
  tickets: string;
}

/**
 * Feature availability per backend — the shipped UI gates on these so controls
 * the real phase-1 API can't fulfil disable cleanly instead of erroring, while
 * the mock keeps everything on. Derived from the backend via `assetCapabilities`.
 *
 * Real Geins.Media phase 1 ships browse + upload, `PATCH` (description/altText/
 * localizations only), `POST …/relocate` (rename + move) and `DELETE`
 * (+ restore). Those work on both backends and therefore carry no flag at all;
 * tags/channels/replace/thumbnails/tag-autocomplete and the folder-delete asset
 * disposition are still gated to the mock until phase 2.
 */
export interface AssetCapabilities {
  backend: AssetsBackend;
  /** Edit + save an asset's description and localized alt text (phase-1 PATCH). */
  canEditDescriptionAltText: boolean;
  /** Edit an asset's tags. */
  canEditTags: boolean;
  /** Edit an asset's publication channels. */
  canEditChannels: boolean;
  canDeleteAsset: boolean;
  /**
   * Folder delete can decide what happens to the assets inside (re-home to
   * uncategorised, or delete them too). Phase 1's `DELETE /media/folders/{id}`
   * is empty-only and answers `409 FOLDER_NOT_EMPTY` instead.
   */
  canDeleteFolderWithAssets: boolean;
  canReplaceFile: boolean;
  /** Suggest existing tags from the distinct-tags source. */
  tagAutocomplete: boolean;
  /** Backend produces real thumbnails (`thumbUrl`); phase 1 returns null. */
  hasThumbnails: boolean;
}

/**
 * The subset of a product the wizard shows when an image links to one — enough
 * to render the linked indicator and the "group by products" header. A filename
 * ref links if it matches EITHER the product's `_id` (the id merchants use) or
 * its `articleNumber`.
 */
export interface ProductMatch extends EntityBaseWithName {
  articleNumber: string;
  /** Product image src (already in the fetched product list); may be absent. */
  thumbnail?: string;
}
