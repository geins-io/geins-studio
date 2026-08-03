import type { AssetType } from '#shared/types';

/**
 * Maps a file's mime type to an {@link AssetType}. Shared by the upload route
 * (deriving the stored asset's type) and the upload UI (per-file icon/tint).
 */
export function mimeToAssetType(mime: string): AssetType {
  const m = (mime || '').toLowerCase();
  if (m === 'image/svg+xml') return 'svg';
  if (m.startsWith('image/')) return 'image';
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
