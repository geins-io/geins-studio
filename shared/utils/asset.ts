import type {
  AssetCapabilities,
  AssetsBackend,
  AssetType,
} from '#shared/types';

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
