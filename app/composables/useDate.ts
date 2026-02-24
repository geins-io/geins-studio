import { useDateFormatter } from 'reka-ui';

interface UseDateReturnType {
  formatDate: (
    value: string | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
}

/**
 * Composable for locale-aware date formatting.
 *
 * Wraps reka-ui's `useDateFormatter` with the app's current locale
 * to provide consistent date display across the application.
 * Uses the same formatting as table date columns and the calendar picker.
 *
 * @returns {UseDateReturnType} - An object containing date formatting utilities
 * @property {function} formatDate - Formats a date value using the app locale (defaults to `dateStyle: 'long'`)
 */
export const useDate = (): UseDateReturnType => {
  const locale = useCookieLocale();
  const dateFormatter = useDateFormatter(locale.value);

  const formatDate = (
    value: string | Date | undefined | null,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
  ): string => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return dateFormatter.custom(date, options);
  };

  return { formatDate };
};
