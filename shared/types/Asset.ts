import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  EntityBaseWithName,
  ApiOptions,
  BatchQuery,
  ListDateRange,
  ListSortDirection,
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
   * On `PATCH` each one replaces the whole set: omit it to keep what's stored,
   * send `[]` to clear. A response always carries both (see {@link Asset}).
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
 * `202` body of `POST /media/assets/bulk-move` — the copies run in the
 * background, and `GET media/moves/{moveId}` reports when they land. The
 * client doesn't poll it yet; callers refresh once instead.
 */
export interface AssetBulkMove {
  moveId: string;
}

/**
 * `202` body of `POST /media/assets/bulk-purge` and `POST /media/trash/empty`:
 * how many trashed assets are now due for purge. The purge itself runs after
 * the call, usually within a minute.
 */
export interface AssetTrashPurge {
  assetCount: number;
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
export interface AssetLink extends AssetLinkTarget<
  AssetLinkTargetType | (string & {})
> {
  assetId: string;
  createdBy?: string | null;
  createdAt: string;
}

/**
 * The writable link kinds. A product link is split by what the asset is to the
 * product: `productimage` (image + svg only — anything else is a `422`, or
 * `LINK_ASSET_TYPE_INVALID` on a ticket) or `productfile` (any type).
 */
export type AssetLinkTargetType = 'productimage' | 'productfile';

/**
 * What a link points at — the body of `POST /media/assets/{id}/links` and one
 * item of a ticket claim's `links`. On a read `T` is widened: the API documents
 * that it returns target types this release does not name, so readers must
 * tolerate an unknown one.
 */
export interface AssetLinkTarget<T extends string = AssetLinkTargetType> {
  targetType: T;
  /**
   * The target's id as stored. A product id has its leading zero stripped when
   * the link is written, so matching it back to a product must tolerate that.
   */
  targetId: string;
}

/**
 * What a bulk link selection holds: only images (image/svg), no images, or
 * both — decides which "Link as" choices the bulk pane offers.
 */
export type AssetSelectionKind = 'images' | 'files' | 'mixed';

/**
 * How a bulk link treats the selection: `byType` links images/svg as product
 * images and everything else as files; `file` links everything as files.
 * There is no "all as image" — a non-image can't be one (`422`).
 */
export type BulkLinkMode = 'byType' | 'file';

/** The bulk "Link to products" action's value. */
export interface AssetBulkLinkValue {
  mode: BulkLinkMode;
  productIds: string[];
}

/** One `POST media/assets/bulk-link` body. */
export interface BulkLinkCall {
  assetIds: string[];
  links: AssetLinkTarget[];
}

// =============================================================================
// Upload ticket flow (Geins.Media 3-step upload: ticket → PUT bytes → complete)
//
// Phase 1 uploads claim a ticket, PUT bytes straight to storage via a returned
// plan URL, then confirm with `complete`. The claim carries metadata too —
// description / alt text / localizations / product links are applied when the
// ticket completes, so an upload needs no follow-up write.
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
  /** Links created when the ticket completes (max 100 per file). */
  links?: AssetLinkTarget[];
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
  | 'SCAN_REJECTED'
  | 'LINK_ASSET_TYPE_INVALID';

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

/**
 * Body of `POST /media/assets/{id}/replace` — claims a one-file ticket that
 * overwrites the asset's bytes in place. `fileName`'s extension must be the
 * asset's own (or an alias for the same type); the path never changes.
 */
export interface AssetReplace {
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
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
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Always present on a read — empty when unset. */
  tags: string[];
  /** Channel ids. Always present on a read — empty when unset. */
  channels: string[];
  /** When the asset was moved to the trash; `null` while it's live. */
  deletedAt: string | null;
  /**
   * When a trashed asset stops being restorable. Fixed at trash time, so a
   * later change to the retention window doesn't move it.
   */
  purgeAfter: string | null;
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

/** `sortBy` values accepted by `POST /media/assets/query`. */
export type AssetSortField =
  | 'name'
  | 'type'
  | 'folderPath'
  | 'sizeBytes'
  | 'mime'
  | 'createdBy'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'purgeAfter';

/** Filter-kit filters for the asset list — the `filters` of `ListQueryState`. */
export interface AssetQueryFilters {
  assetTypes?: AssetType[];
  channels?: string[];
  createdBy?: string;
  /** ISO date-time, inclusive. */
  modifiedFrom?: string;
  /** ISO date-time, inclusive. */
  modifiedTo?: string;
}

/**
 * The library's filter-bar state — `AssetQueryFilters` with the modified range
 * kept as a `ListDateRange` (a preset resolves only when the query is sent).
 */
export interface AssetListFilters {
  assetTypes?: AssetType[];
  channels?: string[];
  modified?: ListDateRange;
}

/** Folder / trash scope of an asset query — see `assetListOptions`. */
export type AssetQueryScope = Pick<AssetApiOptions, 'folderId' | 'trashed'>;

/**
 * Request body of `POST /media/assets/query` (`media_request_assetQuery`).
 * Filters combine with AND; `all` matches every asset regardless of them.
 */
export interface AssetQuery extends BatchQuery, AssetQueryFilters {
  assetIds?: string[];
  assetName?: string;
  /** A `null` entry is the library root. */
  folderIds?: (string | null)[];
  folderName?: string;
  includeSubfolders?: boolean;
  trashed?: boolean;
  languages?: string[];
  /** Word-prefix match, not substring. */
  search?: string;
  sortBy?: AssetSortField;
  sortDirection?: ListSortDirection;
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
 * `?action=` of `DELETE media/folders/{id}` for a folder that isn't empty. Each
 * takes the whole subtree: `trash` trashes the folders + live assets
 * (restorable), `relocate` moves the live assets to the library root (their
 * URLs change) and trashes the folders, `purge` permanently deletes everything
 * under it, trashed assets included.
 */
export type FolderDeleteAction = 'trash' | 'relocate' | 'purge';

/** `media_response_folderDeletion`: what a folder delete `action` took. */
export interface FolderDeletion {
  /** Folders that left the tree, the deleted one included. */
  folderCount: number;
  /** Assets the action took (trashed, relocated or due for purge). */
  assetCount: number;
  /** Only on a `relocate` that moves at least one asset. */
  moveId?: string | null;
}

// =============================================================================
// Backend capabilities
// =============================================================================

/**
 * Feature availability for the shipped Geins.Media surface — the UI gates on
 * these so controls phase 1 can't fulfil disable cleanly instead of erroring.
 * Only still-gated features carry a flag: browse, upload, metadata `PATCH`,
 * `relocate`, `DELETE` + restore, folder delete actions, replace and usage
 * links all ship, so they have none.
 * Read via `assetCapabilities`.
 */
export interface AssetCapabilities {
  /**
   * The upload ticket accepts tags + channels. Until it does, the wizard holds
   * them in state but can't send them (the detail panel `PATCH` already can).
   */
  canUploadTagsAndChannels: boolean;
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
