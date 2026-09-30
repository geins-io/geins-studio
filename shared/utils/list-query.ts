import type { ListQueryState, ListSort } from '#shared/types';

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

function firstString(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : undefined;
}

function serializeSort(sort: ListSort | null): string {
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
