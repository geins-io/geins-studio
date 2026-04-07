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
 * @param countryCode — ISO 3166-1 alpha-2 country code (e.g. "se", "GB")
 * @param square — render as a square (default true); false renders the standard 4:3 ratio
 */
export function flagClass(countryCode: string, square = true): string {
  const code = countryCode.toLowerCase();
  return square ? `fi fis fi-${code}` : `fi fi-${code}`;
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
