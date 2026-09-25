import type {
  AssetApiOptions,
  AssetCapabilities,
  AssetType,
  UploadRejectionCode,
} from '#shared/types';

// Upload-ticket limits — the real Geins.Media `createUploadTicket` caps. The
// client validates + chunks against them before claiming a ticket, so an
// over-cap claim never reaches the backend as a 400.
export const MAX_FILES_PER_TICKET = 50;
export const MAX_FILE_BYTES = 1024 ** 3; // 1 GB per file
export const MAX_TICKET_BYTES = 10 * 1024 ** 3; // 10 GB per ticket total

// `assetQuery` caps `pageSize` here (default 100); the list fetches one page at
// the cap and treats it as the whole library.
export const ASSET_QUERY_PAGE_SIZE = 1000;

// Extension → MIME for the upload path. The browser leaves `File.type` empty
// for many types (e.g. `.svg`, some `.mp4`), and the ticket flow needs a
// declared `mimeType`, so derive it from the name when the browser gives none.
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  csv: 'text/csv',
};

/**
 * Content type to declare for an upload: the browser's `File.type` when set,
 * else derived from the file extension, else `application/octet-stream` (the
 * server sniffs the real bytes on complete and rejects a mismatch).
 */
export function contentTypeForUpload(
  name: string,
  browserType?: string,
): string {
  if (browserType) return browserType;
  const ext = name.toLowerCase().split('.').pop() ?? '';
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

// Friendly, translatable copy per upload rejection code. The client shows these
// (not the raw backend `message`, which is English + terse) so the reason is
// localized; rare/unknown codes fall back to a generic line. Keys live under
// `asset_library.*` in both locales.
const UPLOAD_REJECTION_KEYS: Record<UploadRejectionCode, string> = {
  PATH_INVALID: 'asset_library.upload_reject_path_invalid',
  PATH_ALREADY_EXISTS: 'asset_library.upload_reject_path_already_exists',
  PATH_MOVE_PENDING: 'asset_library.upload_reject_path_move_pending',
  FILE_TOO_LARGE: 'asset_library.upload_reject_file_too_large',
  FILE_TYPE_NOT_ALLOWED: 'asset_library.upload_reject_file_type_not_allowed',
  FOLDER_INVALID: 'asset_library.upload_reject_folder_invalid',
  FOLDER_DEPTH_EXCEEDED: 'asset_library.upload_reject_folder_depth_exceeded',
  FORBIDDEN: 'asset_library.upload_reject_forbidden',
  QUOTA_EXCEEDED: 'asset_library.upload_reject_quota_exceeded',
  BLOB_MISSING: 'asset_library.upload_reject_blob_missing',
  CONTENT_TYPE_MISMATCH: 'asset_library.upload_reject_content_type_mismatch',
  SCAN_REJECTED: 'asset_library.upload_reject_scan_rejected',
};

/** i18n key for an upload rejection code's friendly reason (generic fallback). */
export function uploadRejectionMessageKey(code: UploadRejectionCode): string {
  return UPLOAD_REJECTION_KEYS[code] ?? 'asset_library.upload_reject_generic';
}

// Asset types a browser can render in an `<img>`; everything else gets a type
// icon. `svg` is separate from `image` in AssetType but renders the same way.
const PREVIEWABLE_TYPES = new Set<AssetType>(['image', 'svg']);

/**
 * Preview source for an asset: the backend's thumbnail when there is one, else
 * the full-size file for types an `<img>` can render. Geins.Media phase 1 serves
 * no thumbnails (`thumbUrl: ''`) but does return a usable `url`, so without the
 * fallback the whole library renders as type icons. Returns null when there is
 * nothing previewable — the caller shows the icon block.
 */
export function assetPreviewUrl(
  type: AssetType,
  thumbUrl?: string | null,
  url?: string | null,
): string | null {
  if (thumbUrl) return thumbUrl;
  return PREVIEWABLE_TYPES.has(type) && url ? url : null;
}

// ── Folder rail selection ────────────────────────────────────────────────────

/**
 * Rail selection for "assets with no folder" — the library root. Not a folder
 * id: real Geins.Media has no folder row for it, the state is `folderId: null`
 * on the asset and `folderIds: [null]` on the query. Also the `?folder=` URL
 * value, so the view deep-links like any folder.
 */
export const ROOT_FOLDER_KEY = 'root';

/**
 * Rail selection for the trash view. Like {@link ROOT_FOLDER_KEY} it is not a
 * folder id — it swaps the whole query for `trashed: true`, which returns only
 * soft-deleted assets (see `AssetApiOptions.trashed`).
 */
export const TRASH_KEY = 'trash';

/**
 * How long a soft-deleted asset stays restorable before Geins.Media hard-deletes
 * it. Configurable server-side, so this is the copy's number, not a guarantee —
 * the UI only states it, nothing branches on it.
 */
export const TRASH_RETENTION_DAYS = 30;

/**
 * List options for a rail selection: `null` (All assets) sends no folder scope
 * at all, {@link ROOT_FOLDER_KEY} scopes to the root, {@link TRASH_KEY} asks for
 * the trashed set instead, and anything else is a folder id. `folderId: null`
 * and `undefined` are different queries here — the root view and "every folder"
 * must not collapse into each other.
 */
export function assetListOptions(
  selected: string | null,
): AssetApiOptions | undefined {
  if (selected === null) return undefined;
  // Trash is its own query, not a folder scope: `trashed: true` returns only
  // the soft-deleted assets, across every folder.
  if (selected === TRASH_KEY) return { trashed: true };
  return { folderId: selected === ROOT_FOLDER_KEY ? null : selected };
}

/**
 * The folder id a rail selection writes to (upload target, move destination):
 * a real id, or `null` for the root — All assets, Uncategorised and Trash.
 */
export function folderIdForSelection(selected: string | null): string | null {
  return selected === ROOT_FOLDER_KEY || selected === TRASH_KEY
    ? null
    : selected;
}

/**
 * Feature availability against the shipped Geins.Media surface. Phase 1 serves
 * browse + upload, `PATCH` (description/altText/localizations), `POST …/
 * relocate` (rename + move), `DELETE` (+ restore) and usage links — all
 * unconditional, so none of them carry a flag. Tags, channels, replace,
 * thumbnails, tag autocomplete and the folder-delete asset disposition stay off
 * until phase 2. Pure so it can be unit-tested and reused by
 * `useAssetCapabilities`.
 *
 * cutover: REVISIT@phase2 — the whole capability mechanism is temporary; remove
 * it (+ its consumers) once phase 2 restores the gated features. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function assetCapabilities(): AssetCapabilities {
  return {
    canEditTags: false,
    canEditChannels: false,
    canDeleteFolderWithAssets: false,
    canReplaceFile: false,
    tagAutocomplete: false,
    hasThumbnails: false,
  };
}

/**
 * The product reference embedded in an upload filename: everything before the
 * first underscore (`9963010083_hero.jpg` → `9963010083`, `C-228_front.jpg` →
 * `C-228`). Refs are matched against a product's article number or id, both of
 * which are alphanumeric in Geins — so this is deliberately not digits-only.
 * Parsing the ref from the name is the frontend's job; the lookup that turns it
 * into a match is the backend's. Returns null when the name has no `<ref>_`
 * prefix (no underscore, or nothing before it).
 */
export function parseProductRef(filename: string): string | null {
  return /^([^_]+)_/.exec(filename)?.[1]?.trim() || null;
}

// Raster image mimes browsers can render inline. Only these become `image` (and
// get an `<img>` preview) — an `image/*` prefix is too broad: formats like PSD
// (`image/vnd.adobe.photoshop`), TIFF and HEIC are images but can't be shown in
// an `<img>`, so they fall through to a generic file type instead of a broken
// preview.
const RENDERABLE_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/apng',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

/**
 * Maps a file's mime type to an {@link AssetType}. Shared by the upload route
 * (deriving the stored asset's type) and the upload UI (per-file icon/tint).
 */
export function mimeToAssetType(mime: string): AssetType {
  const m = (mime || '').toLowerCase();
  if (m === 'image/svg+xml') return 'svg';
  if (RENDERABLE_IMAGE_MIMES.has(m)) return 'image';
  if (m === 'application/pdf') return 'pdf';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (
    m.startsWith('text/') ||
    m.includes('word') ||
    m.includes('excel') ||
    m.includes('spreadsheet') ||
    m.includes('presentation') ||
    m.includes('officedocument') ||
    m.includes('opendocument')
  ) {
    return 'doc';
  }
  return 'other';
}
