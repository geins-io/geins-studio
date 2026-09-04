import type {
  AssetCapabilities,
  AssetsBackend,
  AssetType,
} from '#shared/types';

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

/**
 * Feature availability for a given backend. Everything is on for the `mock`;
 * `media-phase1` serves browse + upload only, so it gates the controls the real
 * phase-1 API doesn't implement yet (they return in a later phase). Pure so it
 * can be unit-tested and reused by the `useAssetCapabilities` composable.
 *
 * cutover: REVISIT@phase2 — the whole capability mechanism is temporary; remove
 * it (+ its consumers) once phase 2 restores the gated features. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function assetCapabilities(backend: AssetsBackend): AssetCapabilities {
  const mock = backend === 'mock';
  return {
    backend,
    canEditMetadata: mock,
    canMoveAsset: mock,
    canDeleteAsset: mock,
    canReplaceFile: mock,
    tagAutocomplete: mock,
    hasThumbnails: mock,
  };
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
