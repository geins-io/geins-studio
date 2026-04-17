import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 *
 * @param updaterOrValue
 * @param ref
 */
export function valueUpdater<T extends Updater<unknown>>(
  updaterOrValue: T,
  ref: Ref,
) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue;
}

/**
 * Generates a unique internal ID for tracking UI elements
 * @returns A unique string identifier
 */
export function generateInternalId(): string {
  return `internal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Returns a person's full name from an entity with firstName/lastName fields.
 * Handles null/undefined entity and missing name parts gracefully.
 */
export function fullName(
  entity?: { _id?: string; firstName?: string; lastName?: string } | null,
): string {
  return (
    `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() ||
    entity?._id ||
    ''
  );
}

/**
 * Returns the CSS class string for rendering a flag icon via the `flag-icons` library.
 * Renders as a circle by default (square aspect ratio + rounded-full).
 * @param countryCode — ISO 3166-1 alpha-2 country code (e.g. "se", "GB")
 * @param round — render as a circle (default true); false renders the standard 4:3 ratio
 */
export function flagClass(countryCode: string, square = true): string {
  const code = countryCode.toLowerCase();
  return square ? `fib fis fi-${code}` : `fib fi-${code}`;
}

/**
 * Maps a language code (ISO 639-1) to a country code (ISO 3166-1 alpha-2) for flag display.
 * Falls back to the language code itself for codes that match (e.g. "de" → "de").
 */
export function languageToCountryCode(langCode: string): string {
  const map: Record<string, string> = {
    en: 'gb',
    sv: 'se',
    da: 'dk',
    ja: 'jp',
    ko: 'kr',
    zh: 'cn',
    ar: 'sa',
    he: 'il',
    uk: 'ua',
    cs: 'cz',
    el: 'gr',
    nb: 'no',
    nn: 'no',
    sl: 'si',
    et: 'ee',
    hi: 'in',
    fa: 'ir',
    vi: 'vn',
    ms: 'my',
    sq: 'al',
    ka: 'ge',
    hy: 'am',
  };
  const code = langCode.toLowerCase().split('-')[0] ?? langCode.toLowerCase();
  return map[code] || code;
}

/**
 * Prettifies a mail text key for display by stripping the longest common
 * `_`-delimited segment prefix shared across all keys in the same mail's
 * text list, then converting the remainder to sentence case.
 *
 * Falls back to the full prettified key when `allKeys` has fewer than 2
 * entries or when stripping would leave an empty string.
 *
 * @example
 * prettifyLangKey('ORDER_PREPARED_INBOX_PREVIEW', [
 *   'ORDER_PREPARED_SUBJECT',
 *   'ORDER_PREPARED_INBOX_PREVIEW',
 * ])
 * // → 'Inbox preview'
 */
export function prettifyLangKey(key: string, allKeys: string[]): string {
  const segments = (k: string) => k.split('_').filter(Boolean);
  const toSentenceCase = (s: string) => {
    const lower = s.toLowerCase().replace(/_/g, ' ');
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  if (allKeys.length < 2) return toSentenceCase(key);

  const allSegments = allKeys.map(segments);
  const minLen = Math.min(...allSegments.map((s) => s.length));
  let prefixLen = 0;
  for (let i = 0; i < minLen; i++) {
    const seg = allSegments[0]![i];
    if (allSegments.every((s) => s[i] === seg)) {
      prefixLen = i + 1;
    } else {
      break;
    }
  }

  const stripped = segments(key).slice(prefixLen).join('_');
  return toSentenceCase(stripped || key);
}

/**
 * Returns the name of an entity given its ID from a list of entities.
 * @returns {string}
 */
export function getEntityNameById(
  id: string,
  all: EntityBaseWithName[],
): string {
  const entity = all.find((pl) => pl._id === id);
  return entity?.displayName || entity?.name || id;
}
