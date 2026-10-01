import type {
  ListDateRange,
  ListDateRangePreset,
  ListQueryState,
  ListSort,
} from '#shared/types';

/** Encodes one filter value to and from a URL query string. */
export interface ListQueryParam<V> {
  /** `undefined` for anything invalid — it falls back to the default. */
  parse: (raw: string) => V | undefined;
  serialize: (value: V) => string;
}

export type ListQueryFilterParams<TFilters> = {
  [K in keyof TFilters]?: ListQueryParam<NonNullable<TFilters[K]>> & {
    /** URL key; defaults to the filter name. */
    key?: string;
  };
};

export interface ListQueryRouteKeys {
  page: string;
  perPage: string;
  sort: string;
  search: string;
}

export interface ListQueryRouteConfig<TFilters> {
  keys: ListQueryRouteKeys;
  defaults: Omit<ListQueryState<TFilters>, 'page' | 'search'>;
  pageSizes?: number[];
  /** Sortable column ids; omitted accepts any. */
  sortFields?: readonly string[];
  filters?: ListQueryFilterParams<TFilters>;
}

export const DEFAULT_LIST_QUERY_ROUTE_KEYS: ListQueryRouteKeys = {
  page: 'page',
  perPage: 'perPage',
  sort: 'sort',
  search: 'q',
};

/** A comma-separated list; values outside `allowed` are dropped. */
export function listParam<T extends string = string>(
  allowed?: readonly T[],
): ListQueryParam<T[]> {
  const isAllowed = (value: string): value is T =>
    !allowed || allowed.some((a) => a === value);
  return {
    parse: (raw) => {
      const values = [
        ...new Set(
          raw
            .split(',')
            .map((v) => v.trim())
            .filter(isAllowed),
        ),
      ].filter(Boolean);
      return values.length ? values : undefined;
    },
    serialize: (value) => value.join(','),
  };
}

/** A plain trimmed string. */
export function stringParam(): ListQueryParam<string> {
  return {
    parse: (raw) => raw.trim() || undefined,
    serialize: (value) => value,
  };
}

const DATE_RANGE_PRESETS: readonly ListDateRangePreset[] = [
  'today',
  'week',
  'month',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of an ISO date-time, as `YYYY-MM-DD`. */
function localDay(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a `YYYY-MM-DD` day; `undefined` for a non-existent date. */
function parseLocalDay(raw: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return undefined;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  // `new Date` rolls 2026-02-31 over to March — reject instead.
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return undefined;
  return date;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * The concrete, inclusive `from`/`to` of a range. Presets are calendar-based in
 * local time (the week starts on Monday) and resolved against `now`, so call
 * this when the query is sent — a stored preset never goes stale.
 */
export function resolveListDateRange(
  range: ListDateRange,
  now: Date = new Date(),
): { from?: string; to?: string } {
  if (!range.preset) return { from: range.from, to: range.to };
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let last = new Date(start);
  if (range.preset === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    last = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (range.preset === 'month') {
    start.setDate(1);
    last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const end = endOfDay(last);
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * A date range as a preset (`today`, `week`, `month`) or `from..to` local days
 * (`2026-09-01..2026-09-30`; either end may be open). `from` reads as the start
 * of its day, `to` as the end.
 */
export function dateRangeParam(): ListQueryParam<ListDateRange> {
  return {
    parse: (raw) => {
      const value = raw.trim();
      const preset = DATE_RANGE_PRESETS.find((p) => p === value);
      if (preset) return { preset };
      const parts = value.split('..');
      if (parts.length !== 2) return undefined;
      const [rawFrom = '', rawTo = ''] = parts;
      const from = rawFrom ? parseLocalDay(rawFrom) : undefined;
      const to = rawTo ? parseLocalDay(rawTo) : undefined;
      if ((rawFrom && !from) || (rawTo && !to) || (!from && !to))
        return undefined;
      if (from && to && from > to) return undefined;
      return {
        ...(from ? { from: from.toISOString() } : {}),
        ...(to ? { to: endOfDay(to).toISOString() } : {}),
      };
    },
    serialize: (value) => {
      if (value.preset) return value.preset;
      const from = value.from ? (localDay(value.from) ?? '') : '';
      const to = value.to ? (localDay(value.to) ?? '') : '';
      return from || to ? `${from}..${to}` : '';
    },
  };
}

function firstString(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : undefined;
}

/** The `?sort` value: `field`, or `-field` for descending. */
export function serializeSort(sort: ListSort | null): string {
  if (!sort) return '';
  return sort.direction === 'desc' ? `-${sort.field}` : sort.field;
}

function parseSort(
  raw: string,
  sortFields?: readonly string[],
): ListSort | null | undefined {
  if (raw === '') return null;
  const desc = raw.startsWith('-');
  const field = desc ? raw.slice(1) : raw;
  if (!field || (sortFields && !sortFields.includes(field))) return undefined;
  return { field, direction: desc ? 'desc' : 'asc' };
}

function serializeFilter<V>(
  param: ListQueryParam<NonNullable<V>>,
  value: V,
): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value) && value.length === 0) return '';
  return param.serialize(value);
}

/** Every URL key the config owns — anything else in the query is left alone. */
export function listQueryRouteKeys<TFilters>(
  config: ListQueryRouteConfig<TFilters>,
): string[] {
  const keys: string[] = Object.values(config.keys);
  for (const name in config.filters)
    keys.push(config.filters[name]?.key ?? name);
  return keys;
}

/**
 * List state from a route query. Absent keys take the default; invalid values
 * (a non-numeric page, a disallowed page size or sort field, an unparsable
 * filter) fall back to it too.
 */
export function readListQueryRoute<TFilters extends object>(
  query: Record<string, unknown>,
  config: ListQueryRouteConfig<TFilters>,
): ListQueryState<TFilters> {
  const { keys, defaults, pageSizes } = config;

  const rawPage = firstString(query[keys.page]);
  const page =
    rawPage && /^\d+$/.test(rawPage) && Number(rawPage) >= 1
      ? Number(rawPage)
      : 1;

  const perPage = Number(firstString(query[keys.perPage]));
  const pageSize =
    Number.isInteger(perPage) &&
    perPage > 0 &&
    (!pageSizes || pageSizes.includes(perPage))
      ? perPage
      : defaults.pageSize;

  const rawSort = firstString(query[keys.sort]);
  const parsedSort =
    rawSort === undefined ? undefined : parseSort(rawSort, config.sortFields);
  const sort = parsedSort === undefined ? defaults.sort : parsedSort;

  const search = firstString(query[keys.search])?.trim() ?? '';

  const filters = { ...defaults.filters };
  for (const name in config.filters) {
    const param = config.filters[name];
    if (!param) continue;
    const raw = firstString(query[param.key ?? name]);
    if (raw === undefined) continue;
    // Present but empty clears a non-empty default.
    if (raw === '') {
      Reflect.deleteProperty(filters, name);
      continue;
    }
    const value = param.parse(raw);
    if (value !== undefined) filters[name] = value;
  }

  return { page, pageSize, sort, search, filters };
}

/**
 * The route query for a list state, holding only the keys that differ from the
 * defaults. A value cleared from a non-empty default is written as `key=` so it
 * survives a reload.
 */
export function writeListQueryRoute<TFilters>(
  state: ListQueryState<TFilters>,
  config: ListQueryRouteConfig<TFilters>,
): Record<string, string> {
  const { keys, defaults } = config;
  const query: Record<string, string> = {};

  if (state.page > 1) query[keys.page] = String(state.page);
  if (state.pageSize !== defaults.pageSize)
    query[keys.perPage] = String(state.pageSize);

  const sort = serializeSort(state.sort);
  if (sort !== serializeSort(defaults.sort)) query[keys.sort] = sort;

  if (state.search) query[keys.search] = state.search;

  for (const name in config.filters) {
    const param = config.filters[name];
    if (!param) continue;
    const value = serializeFilter(param, state.filters[name]);
    if (value !== serializeFilter(param, defaults.filters[name]))
      query[param.key ?? name] = value;
  }

  return query;
}
