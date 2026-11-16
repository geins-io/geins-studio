/**
 * Calendar days: dates that name a day, not a moment (e.g. a delivery date).
 * The API takes and stores one as that day at UTC midnight. Sending a local
 * midnight as a UTC instant would shift the day back east of UTC.
 */

const pad = (n: number) => String(n).padStart(2, '0');

const isUtcMidnight = (date: Date) =>
  date.getUTCHours() === 0 &&
  date.getUTCMinutes() === 0 &&
  date.getUTCSeconds() === 0 &&
  date.getUTCMilliseconds() === 0;

/** Local calendar day of an ISO date-time, as `YYYY-MM-DD`. */
export function localDay(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The calendar day a date value names, as `YYYY-MM-DD`. A value at exactly UTC
 * midnight already is a calendar day (the API stores them so and the date
 * picker emits them so), so it keeps its UTC date. Any other instant names its
 * local day.
 */
export function calendarDay(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (isUtcMidnight(date)) return date.toISOString().slice(0, 10);
  return localDay(value);
}

/** The calendar day at UTC midnight, `YYYY-MM-DDT00:00:00Z`: what the API takes. */
export function toCalendarDayIso(value: string): string | undefined {
  const day = calendarDay(value);
  return day ? `${day}T00:00:00Z` : undefined;
}

/**
 * Local midnight of the calendar day, as an ISO instant. A date picker that
 * formats in local time shows it as that day in any time zone.
 */
export function calendarDayToLocalIso(value: string): string | undefined {
  const day = calendarDay(value);
  if (!day) return undefined;
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toISOString();
}
