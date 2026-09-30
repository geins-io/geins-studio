import { useDebounceFn } from '@vueuse/core';
import type {
  BatchQueryResult,
  ListQueryRequestOptions,
  ListQueryState,
  ListSort,
} from '#shared/types';
import {
  DEFAULT_LIST_QUERY_ROUTE_KEYS,
  listQueryRouteKeys,
  readListQueryRoute,
  writeListQueryRoute,
  type ListQueryFilterParams,
  type ListQueryRouteConfig,
  type ListQueryRouteKeys,
} from '#shared/utils/list-query';
import type { NuxtError } from '#app';
import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { ComputedRef, Ref, WritableComputedRef } from 'vue';

export interface UseListQueryOptions<T, TFilters> {
  /** Stable `useAsyncData` key. */
  key: string;
  /** The repository adapter, e.g. `assetApi.query`. */
  fetcher: (
    state: ListQueryState<TFilters>,
    options: ListQueryRequestOptions,
  ) => Promise<BatchQueryResult<T>>;
  defaults: {
    filters: TFilters;
    pageSize?: number;
    sort?: ListSort | null;
  };
  /** Allowed page sizes; any other value falls back to the default. */
  pageSizes?: number[];
  searchDebounceMs?: number;
  /**
   * Query inputs the fetcher reads from outside the list state (e.g. the
   * folder scope). A change resets like any other query change.
   */
  deps?: () => unknown;
  immediate?: boolean;
  lazy?: boolean;
  /**
   * Two-way sync with the route query: restored before the first fetch,
   * written back with `router.replace`, defaults omitted.
   */
  route?: {
    /** Override to keep two lists on one page apart. */
    keys?: Partial<ListQueryRouteKeys>;
    /** Sortable column ids accepted from the URL; omitted accepts any. */
    sortFields?: readonly string[];
    filters?: ListQueryFilterParams<TFilters>;
  };
}

export interface UseListQueryReturnType<T, TFilters> {
  page: Ref<number>;
  pageSize: Ref<number>;
  sort: Ref<ListSort | null>;
  /** Raw input — bind this to the search field. */
  searchInput: Ref<string>;
  /** Debounced `searchInput`; what is sent. */
  search: Readonly<Ref<string>>;
  /** Replace, don't mutate — use `setFilter`. */
  filters: Ref<TFilters>;
  items: ComputedRef<T[]>;
  total: ComputedRef<number>;
  pageCount: ComputedRef<number>;
  pending: Ref<boolean>;
  error: Ref<NuxtError | undefined>;
  refresh: () => Promise<void>;
  setFilter: <K extends keyof TFilters>(name: K, value: TFilters[K]) => void;
  resetFilters: () => void;
  /** Search or any filter is set — for the "no matches" empty state. */
  hasActiveQuery: ComputedRef<boolean>;
  /** TanStack adapter: 0-based `pageIndex` ↔ 1-based `page`. */
  pagination: WritableComputedRef<PaginationState>;
  /** TanStack adapter: single-column `SortingState` ↔ `sort`. */
  sorting: WritableComputedRef<SortingState>;
}

const DEFAULT_PAGE_SIZE = 30;

function isActiveFilterValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

/** The query's string values for `keys` (`?q` with no value reads as ''). */
function pickQuery(
  query: Record<string, unknown>,
  keys: string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const raw = query[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === 'string') picked[key] = value;
    else if (value === null) picked[key] = '';
  }
  return picked;
}

function sameQuery(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
}

function statusOf(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  if ('statusCode' in err && typeof err.statusCode === 'number')
    return err.statusCode;
  if ('status' in err && typeof err.status === 'number') return err.status;
  return undefined;
}

/**
 * Server-driven list state (page, page size, sort, search, filters) that lives
 * outside any table, so a grid and a `TableView` can share it. Owns the batch
 * `_id` lifecycle: kept while only the page changes, dropped when the query
 * changes or on `refresh()`.
 */
export function useListQuery<T, TFilters extends object>(
  options: UseListQueryOptions<T, TFilters>,
): UseListQueryReturnType<T, TFilters> {
  const { geinsLogWarn } = useGeinsLog('useListQuery');
  const { fetcher, defaults, pageSizes } = options;

  const defaultPageSize =
    defaults.pageSize ?? pageSizes?.[0] ?? DEFAULT_PAGE_SIZE;

  const routeConfig: ListQueryRouteConfig<TFilters> | undefined =
    options.route && {
      keys: { ...DEFAULT_LIST_QUERY_ROUTE_KEYS, ...options.route.keys },
      defaults: {
        pageSize: defaultPageSize,
        sort: defaults.sort ?? null,
        filters: defaults.filters,
      },
      pageSizes,
      sortFields: options.route.sortFields,
      filters: options.route.filters,
    };
  const route = routeConfig ? useRoute() : undefined;
  // Seeded from the URL up front so the first fetch is already the right one.
  const initial =
    routeConfig && route
      ? readListQueryRoute(route.query, routeConfig)
      : undefined;

  const page = ref(initial?.page ?? 1);
  const pageSize = ref(initial?.pageSize ?? defaultPageSize);
  const sort = shallowRef<ListSort | null>(
    initial ? initial.sort : (defaults.sort ?? null),
  );
  const searchInput = ref(initial?.search ?? '');
  const search = ref(initial?.search ?? '');
  // Boxed: `shallowRef<TFilters>` is a conditional type TS can't resolve for a
  // generic, so the box keeps it a plain `ShallowRef` and `filters` a `Ref`.
  const filterBox = shallowRef({
    current: initial?.filters ?? { ...defaults.filters },
  });
  const filters = computed<TFilters>({
    get: () => filterBox.value.current,
    set: (value) => (filterBox.value = { current: value }),
  });

  const applySearch = useDebounceFn((value: string) => {
    search.value = value.trim();
  }, options.searchDebounceMs ?? 300);
  watch(searchInput, (value) => {
    // Clearing shouldn't wait out the debounce.
    if (!value.trim()) search.value = '';
    else applySearch(value);
  });

  watch(
    pageSize,
    (size) => {
      const valid = Number.isInteger(size) && size > 0;
      if (!valid || (pageSizes && !pageSizes.includes(size)))
        pageSize.value = defaultPageSize;
    },
    { flush: 'sync' },
  );
  watch(
    page,
    (value) => {
      if (!Number.isInteger(value) || value < 1) page.value = 1;
    },
    { flush: 'sync' },
  );

  // Everything but the page: a change here starts a new batch from page 1.
  const querySignature = computed(() =>
    JSON.stringify([
      pageSize.value,
      sort.value,
      search.value,
      filters.value,
      options.deps?.(),
    ]),
  );
  // Sync so the reset lands before the fetch watcher reads the page.
  watch(querySignature, () => (page.value = 1), { flush: 'sync' });
  const requestSignature = computed(
    () => `${querySignature.value}|${page.value}`,
  );

  let batchId: string | undefined;
  let batchSignature: string | undefined;

  const run = (batch: string | undefined, signal: AbortSignal) =>
    fetcher(
      {
        page: page.value,
        pageSize: pageSize.value,
        sort: sort.value,
        search: search.value,
        filters: filters.value,
      },
      { batchId: batch, signal },
    );

  const {
    data,
    pending,
    error,
    refresh: refreshData,
  } = useAsyncData<BatchQueryResult<T> | undefined>(
    options.key,
    async (_nuxtApp, { signal }) => {
      const signature = querySignature.value;
      if (signature !== batchSignature) batchId = undefined;
      let result: BatchQueryResult<T>;
      try {
        result = await run(batchId, signal);
      } catch (err) {
        // A 400 on a request that carried a batch id is the batch itself
        // (expired after 24h, or BATCH_FILTER_MISMATCH) — the same query
        // without it is valid, so retry once on a fresh batch.
        if (!batchId || statusOf(err) !== 400 || signal.aborted) throw err;
        geinsLogWarn('batch rejected, retrying on a new batch', err);
        batchId = undefined;
        result = await run(undefined, signal);
      }
      if (signal.aborted) return result;
      batchId = result._id;
      batchSignature = signature;
      // The set shrank under us (e.g. after deletes) — step to the last page.
      if (result.page > 1 && result.page > result.pageCount)
        page.value = Math.max(1, result.pageCount);
      return result;
    },
    {
      watch: [requestSignature],
      dedupe: 'cancel',
      immediate: options.immediate,
      lazy: options.lazy,
    },
  );

  const items = computed<T[]>(() => {
    const list = data.value?.items;
    return Array.isArray(list) ? list : [];
  });
  const total = computed(() => data.value?.totalItemCount ?? 0);
  const pageCount = computed(() => data.value?.pageCount ?? 0);

  const refresh = async () => {
    batchId = undefined;
    await refreshData();
  };

  const setFilter = <K extends keyof TFilters>(name: K, value: TFilters[K]) => {
    filters.value = { ...filters.value, [name]: value };
  };
  const resetFilters = () => {
    filters.value = { ...defaults.filters };
  };

  const hasActiveQuery = computed(
    () =>
      search.value !== '' ||
      Object.values(filters.value).some(isActiveFilterValue),
  );

  const pagination = computed<PaginationState>({
    get: () => ({ pageIndex: page.value - 1, pageSize: pageSize.value }),
    set: (value) => {
      // A size change resets to page 1 on its own; TanStack's recomputed
      // pageIndex must not override that.
      if (value.pageSize !== pageSize.value) pageSize.value = value.pageSize;
      else page.value = value.pageIndex + 1;
    },
  });

  const sorting = computed<SortingState>({
    get: () =>
      sort.value
        ? [{ id: sort.value.field, desc: sort.value.direction === 'desc' }]
        : [],
    set: (value) => {
      const first = value[0];
      sort.value = first
        ? { field: first.id, direction: first.desc ? 'desc' : 'asc' }
        : null;
    },
  });

  if (routeConfig && route) {
    const router = useRouter();
    const ownKeys = listQueryRouteKeys(routeConfig);
    const routeQuery = computed(() =>
      writeListQueryRoute(
        {
          page: page.value,
          pageSize: pageSize.value,
          sort: sort.value,
          search: search.value,
          filters: filters.value,
        },
        routeConfig,
      ),
    );

    // Immediate so invalid values from a pasted link are cleaned up too.
    watch(
      routeQuery,
      (next) => {
        if (sameQuery(pickQuery(route.query, ownKeys), next)) return;
        const rest = Object.fromEntries(
          Object.entries(route.query).filter(([k]) => !ownKeys.includes(k)),
        );
        router.replace({ query: { ...rest, ...next } });
      },
      { immediate: true },
    );

    // Back / forward (or any outside navigation) drives the state.
    watch(
      () => route.query,
      (query) => {
        const next = readListQueryRoute(query, routeConfig);
        if (sameQuery(writeListQueryRoute(next, routeConfig), routeQuery.value))
          return;
        pageSize.value = next.pageSize;
        sort.value = next.sort;
        filters.value = next.filters;
        searchInput.value = next.search;
        search.value = next.search;
        // Last: the query changes above reset the page to 1.
        page.value = next.page;
      },
    );
  }

  return {
    page,
    pageSize,
    sort,
    searchInput,
    search: readonly(search),
    filters,
    items,
    total,
    pageCount,
    pending,
    error,
    refresh,
    setFilter,
    resetFilters,
    hasActiveQuery,
    pagination,
    sorting,
  };
}
