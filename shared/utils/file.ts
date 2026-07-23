/**
 * Formats a byte count as a human-readable size (e.g. `2.4 MB`). Locale-agnostic
 * units; binary (1024) steps. Used by asset cards and list rows.
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? value : value.toFixed(value < 10 ? 1 : 0);
  return `${rounded} ${units[exponent]}`;
}
