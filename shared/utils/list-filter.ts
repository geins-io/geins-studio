import type {
  ListDateRange,
  ListFilterDefinition,
  ListFilterKind,
  ListFilterMultiselectDefinition,
  ListFilterName,
} from '#shared/types';
import {
  dateRangeParam,
  listParam,
  resolveListDateRange,
  type ListQueryFilterParams,
} from './list-query';

export const LIST_FILTER_MAX_PINNED = 3;

const SEARCHABLE_MIN_OPTIONS = 8;

const DEFAULT_ICONS: Record<ListFilterKind, string> = {
  multiselect: 'ListFilter',
  dateRange: 'CalendarRange',
};

/** The definition's Lucide icon name, or the default for its kind. */
export function listFilterIcon<TFilters>(
  definition: ListFilterDefinition<TFilters>,
): string {
  return definition.icon ?? DEFAULT_ICONS[definition.kind];
}

export function isListFilterSearchable<TFilters>(
  definition: ListFilterMultiselectDefinition<TFilters>,
  optionCount: number,
): boolean {
  return definition.searchable ?? optionCount >= SEARCHABLE_MIN_OPTIONS;
}

export function isListDateRange(value: unknown): value is ListDateRange {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  return ['from', 'to', 'preset'].every((key) => {
    const part: unknown = Reflect.get(value, key);
    return part === undefined || typeof part === 'string';
  });
}

/** A multiselect filter's selected values; `[]` for anything else. */
export function listFilterValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];
}

/** Selected values for a multiselect; 1 or 0 for a date range. */
export function listFilterActiveCount<TFilters>(
  definition: ListFilterDefinition<TFilters>,
  value: unknown,
): number {
  if (definition.kind === 'multiselect') return listFilterValues(value).length;
  return isListDateRange(value) && (value.preset || value.from || value.to)
    ? 1
    : 0;
}

/** Row value per filter name; defaults to the row property of that name. */
export type ListFilterAccessors<TRow, TFilters> = Partial<
  Record<ListFilterName<TFilters>, (row: TRow) => unknown>
>;

function rowValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' || typeof value === 'number')
    return [String(value)];
  return [];
}

function rowTime(value: unknown): number | undefined {
  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  )
    return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

/**
 * Client-mode predicate with the backend's semantics: values within one
 * multiselect OR, filters AND, and a date range is inclusive at both ends.
 * An inactive filter matches every row.
 */
export function matchesListFilters<TRow extends object, TFilters>(
  row: TRow,
  definitions: readonly ListFilterDefinition<TFilters>[],
  filters: TFilters,
  accessors: ListFilterAccessors<TRow, TFilters> = {},
  now: Date = new Date(),
): boolean {
  return definitions.every((definition) => {
    const value = filters[definition.name];
    if (!listFilterActiveCount(definition, value)) return true;
    const accessor = accessors[definition.name];
    const raw = accessor ? accessor(row) : Reflect.get(row, definition.name);

    if (definition.kind === 'multiselect') {
      const selected = listFilterValues(value);
      return rowValues(raw).some((v) => selected.includes(v));
    }

    if (!isListDateRange(value)) return true;
    const time = rowTime(raw);
    if (time === undefined) return false;
    const { from, to } = resolveListDateRange(value, now);
    return (
      (!from || time >= new Date(from).getTime()) &&
      (!to || time <= new Date(to).getTime())
    );
  });
}

/**
 * The `useListQuery` `route.filters` codecs for a definition list, so every
 * filter reaches the URL. Static multiselect options restrict the values read
 * back; async ones can't be checked before they load, so any value is taken
 * and an unknown one simply matches nothing.
 */
export function listFilterRouteParams<TFilters>(
  definitions: readonly ListFilterDefinition<TFilters>[],
): ListQueryFilterParams<TFilters> {
  const entries = definitions.map((definition) => {
    const key = definition.urlKey ? { key: definition.urlKey } : {};
    if (definition.kind === 'dateRange')
      return [definition.name, { ...dateRangeParam(), ...key }];
    const { options } = definition;
    const allowed = Array.isArray(options)
      ? options.map((o) => o.value)
      : undefined;
    return [definition.name, { ...listParam(allowed), ...key }];
  });
  // Each name is constrained by its kind (`ListFilterKeysOfType`) to a key whose
  // value the codec produces; TS can't follow that through the generic.
  return Object.fromEntries(entries) as ListQueryFilterParams<TFilters>;
}
