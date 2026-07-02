/**
 * Time and duration formatters shared across the app.
 *
 * `useDate()` (composable) handles locale-aware absolute dates; this module
 * covers the fixed-format timestamp and duration strings used in execution
 * logs, console views, and tables where the format must be stable regardless
 * of locale.
 */

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');

/**
 * Format an ISO timestamp as `YYYY-MM-DD HH:mm:ss.SSS` in the local timezone.
 * Returns `'–'` for empty input and passes through unparseable strings verbatim.
 */
export const formatTimestamp = (iso: string | null | undefined): string => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

/**
 * Format a millisecond duration in a compact human-readable form:
 * `123ms`, `12.34s`, `1m 23s`. Returns `'–'` for empty input.
 */
export const formatDuration = (ms: number | null | undefined): string => {
  if (ms == null) return '–';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
};
