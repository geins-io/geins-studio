import type {
  AssetCapabilities,
  AssetsBackend,
  AssetType,
  UploadRejectionCode,
} from '#shared/types';

// Upload-ticket limits — the real Geins.Media `createUploadTicket` caps. KEEP:
// these are the API contract, not mock-only. The client validates + chunks
// against them before claiming a ticket, and the mock route enforces the same
// numbers (imported from here so there's one source of truth).
export const MAX_FILES_PER_TICKET = 50;
export const MAX_FILE_BYTES = 1024 ** 3; // 1 GB per file
export const MAX_TICKET_BYTES = 10 * 1024 ** 3; // 10 GB per ticket total

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

/**
 * Feature availability for a given backend. Everything is on for the `mock`.
 * `media-phase1` reflects the shipped Geins.Media surface: browse + upload, plus
 * `PATCH` (description/altText/localizations) and `DELETE` (+ restore) — so
 * description/alt-text edit and delete are on, while rename, tags, channels,
 * move, replace, thumbnails and tag-autocomplete stay gated to the mock until
 * phase 2. Pure so it can be unit-tested and reused by `useAssetCapabilities`.
 *
 * cutover: REVISIT@phase2 — the whole capability mechanism is temporary; remove
 * it (+ its consumers) once phase 2 restores the gated features. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function assetCapabilities(backend: AssetsBackend): AssetCapabilities {
  const mock = backend === 'mock';
  return {
    backend,
    // Shipped in real phase 1 (PATCH description/altText/localizations, DELETE).
    canEditDescriptionAltText: true,
    canDeleteAsset: true,
    // Not in the phase-1 updateAsset surface — mock-only until phase 2.
    canRenameAsset: mock,
    canEditTags: mock,
    canEditChannels: mock,
    canMoveAsset: mock,
    canReplaceFile: mock,
    tagAutocomplete: mock,
    hasThumbnails: mock,
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
