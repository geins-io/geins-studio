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

/**
 * A link from an asset to something outside the media library
 * (`media_response_assetLink`, returned by `GET /media/assets/{id}/links`).
 *
 * The library owns the link, not the thing it points at: nothing server-side
 * resolves a target, so a link to a since-deleted product is still returned and
 * no display name comes with it — the client resolves `targetId` itself (see
 * `useProductMatch`) and falls back to the raw id.
 *
 * The response also carries `_type`, which is deliberately absent here: it is
 * unused, there is no `_id` to pair it with (so `ResponseEntity` would lie), and
 * declaring `_type` on its own is a hard block.
 */
export interface AssetLink {
  assetId: string;
  /**
   * What the link points at. Only `product` can be written today, but the API
   * documents that it returns values this release does not name — so this stays
   * an open string and readers must tolerate an unknown one.
   */
  targetType: string;
  /**
   * The target's id as stored. A product id has its leading zero stripped when
   * the link is written, so matching it back to a product must tolerate that.
   */
  targetId: string;
  createdBy?: string | null;
  createdAt: string;
}

// =============================================================================
// Upload ticket flow (Geins.Media 3-step upload: ticket → PUT bytes → complete)
//
// Phase 1 uploads claim a ticket, PUT bytes straight to storage via a returned
// plan URL, then confirm with `complete`. The claim carries metadata too —
// description / alt text / localizations / product links are applied when the
// ticket completes, so an upload needs no follow-up write. Mock-emulated today
// (see server/api/asset/tickets*), which applies `localizations` and ignores
// `productIds`.
// =============================================================================

/** One file's claim in a ticket request. */
export interface UploadTicketFile {
  /** Client-generated id used to match results back to the source file. */
  clientRef: string;
  /**
   * Target folder. `null` is the library root; **omitting it** puts the claim in
   * path mode — the folders named by `name`'s leading segments are created as
   * needed (`campaigns/hero.jpg` creates `campaigns`).
   */
  folderId?: string | null;
  /** Bare file name when `folderId` is set; otherwise a path, last segment the file. */
  name: string;
  sizeBytes: number;
  mimeType: string;
  /** Overwrite an existing asset at the path (else `PATH_ALREADY_EXISTS`). */
  overwrite?: boolean;
  /** Default-language description, applied on complete. */
  description?: string;
  /** Default-language alt text, applied on complete. */
  altText?: string;
  /** Per-locale `{ description, altText }`, applied on complete. */
  localizations?: Localized<AssetLocalizations>;
  /** Already-resolved products to link the published asset to (max 100). */
  productIds?: string[];
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
  /**
   * Folder scope. A folder id scopes to that folder + its descendants, `null`
   * scopes to the library root (assets with no folder), and omitting it means
   * every folder — the three are distinct queries, so `null` must survive as a
   * value rather than collapse into "no filter".
   */
  folderId?: string | null;
  /**
   * Trash filter — either-or, not an include flag: omitted (or `false`) returns
   * live assets only, `true` returns **only** trashed ones. Deleted assets sit
   * in trash for 30 days before the backend hard-deletes them.
   */
  trashed?: boolean;
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
 * Feature availability for the shipped Geins.Media surface — the UI gates on
 * these so controls phase 1 can't fulfil disable cleanly instead of erroring.
 * Only still-gated features carry a flag: browse, upload, metadata `PATCH`,
 * `relocate`, `DELETE` + restore and usage links all ship, so they have none.
 * Read via `assetCapabilities`.
 */
export interface AssetCapabilities {
  /** Edit an asset's tags. */
  canEditTags: boolean;
  /** Edit an asset's publication channels. */
  canEditChannels: boolean;
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
