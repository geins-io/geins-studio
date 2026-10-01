import { useDateFormatter } from 'reka-ui';

interface UseDateReturnType {
  formatDate: (
    value: string | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatRelativeDate: (
    value: string | Date | undefined | null,
    now?: Date,
  ) => string;
}

const DAY_SECONDS = 86_400;
// Largest unit first; no weeks, so a purge date reads "in 12 days", not "in 2 weeks".
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY_SECONDS],
  ['month', 30 * DAY_SECONDS],
  ['day', DAY_SECONDS],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

/**
 * Composable for locale-aware date formatting.
 *
 * Wraps reka-ui's `useDateFormatter` with the app's current locale
 * to provide consistent date display across the application.
 * Uses the same formatting as table date columns and the calendar picker.
 *
 * @returns {UseDateReturnType} - An object containing date formatting utilities
 * @property {function} formatDate - Formats a date value using the app locale (defaults to `dateStyle: 'long'`)
 * @property {function} formatRelativeDate - Formats a date relative to now ("in 12 days", "3 hours ago")
 */
export const useDate = (): UseDateReturnType => {
  const locale = useCookieLocale();
  const dateFormatter = useDateFormatter(locale.value);

  const toDate = (value: string | Date) =>
    value instanceof Date ? value : new Date(value);

  const formatDate = (
    value: string | Date | undefined | null,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
  ): string => {
    if (!value) return '';
    const date = toDate(value);
    if (isNaN(date.getTime())) return String(value);
    return dateFormatter.custom(date, options);
  };

  const formatRelativeDate = (
    value: string | Date | undefined | null,
    now: Date = new Date(),
  ): string => {
    if (!value) return '';
    const date = toDate(value);
    if (isNaN(date.getTime())) return String(value);
    const seconds = (date.getTime() - now.getTime()) / 1000;
    const [unit, size] = RELATIVE_UNITS.find(
      ([, unitSeconds]) => Math.abs(seconds) >= unitSeconds,
    ) ?? ['second', 1];
    return new Intl.RelativeTimeFormat(locale.value, {
      numeric: 'auto',
    }).format(Math.round(seconds / size), unit);
  };

  return { formatDate, formatRelativeDate };
};
