import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';
import type {
  BatchQueryResult,
  ListQueryRequestOptions,
  ListQueryState,
} from '#shared/types';
import { useListQuery } from '../useListQuery';

interface Row {
  id: string;
}
interface Filters {
  types?: string[];
  owner?: string;
}
type Fetcher = (
  state: ListQueryState<Filters>,
  options: ListQueryRequestOptions,
) => Promise<BatchQueryResult<Row>>;

let seq = 0;
let scope: EffectScope | undefined;

afterEach(() => {
  scope?.stop();
  scope = undefined;
});

// Real useAsyncData: its watch trigger is a 0ms debounce, so let timers and
// microtasks drain a few times.
const settle = async (ms = 0) => {
  for (let i = 0; i < 3; i++) {
    await flushPromises();
    await new Promise((r) => setTimeout(r, ms));
  }
  await nextTick();
};

const page = (
  state: ListQueryState<Filters>,
  batchId = 'b1',
  pageCount = 10,
): BatchQueryResult<Row> => ({
  _id: batchId,
  page: state.page,
  pageSize: state.pageSize,
  totalItemCount: pageCount * state.pageSize,
  pageCount,
  items: [{ id: `row-${state.page}` }],
});

const scopeDep = ref('all');

function setup(fetcher: Fetcher = async (state) => page(state)) {
  scopeDep.value = 'all';
  const spy = vi.fn(fetcher);
  scope = effectScope();
  const query = scope.run(() =>
    useListQuery<Row, Filters>({
      key: `list-query-test-${++seq}`,
      fetcher: spy,
      defaults: { filters: {}, pageSize: 10 },
      pageSizes: [10, 20],
      searchDebounceMs: 20,
      deps: () => scopeDep.value,
    }),
  )!;
  const lastCall = () => spy.mock.calls.at(-1)!;
  return { query, spy, lastCall };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('useListQuery', () => {
  it('fetches the first page and exposes the batch result', async () => {
    const { query, spy } = setup();
    await settle();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual({
      page: 1,
      pageSize: 10,
      sort: null,
      search: '',
      filters: {},
    });
    expect(spy.mock.calls[0]![1].batchId).toBeUndefined();
    expect(query.items.value).toEqual([{ id: 'row-1' }]);
    expect(query.total.value).toBe(100);
    expect(query.pageCount.value).toBe(10);
  });

  it('keeps the batch id when only the page changes', async () => {
    const { query, lastCall } = setup();
    await settle();
    query.page.value = 3;
    await settle();
    expect(lastCall()[0].page).toBe(3);
    expect(lastCall()[1].batchId).toBe('b1');
  });

  it.each([
    [
      'sort',
      (q: ReturnType<typeof setup>['query']) => {
        q.sort.value = { field: 'name', direction: 'asc' };
      },
    ],
    [
      'page size',
      (q: ReturnType<typeof setup>['query']) => {
        q.pageSize.value = 20;
      },
    ],
    [
      'filters',
      (q: ReturnType<typeof setup>['query']) => {
        q.setFilter('types', ['image']);
      },
    ],
  ])('a %s change resets to page 1 and drops the batch', async (_, change) => {
    const { query, lastCall } = setup();
    await settle();
    query.page.value = 4;
    await settle();
    change(query);
    await settle();
    expect(query.page.value).toBe(1);
    expect(lastCall()[0].page).toBe(1);
    expect(lastCall()[1].batchId).toBeUndefined();
  });

  it('treats a deps change as a query change', async () => {
    const { query, lastCall } = setup();
    await settle();
    query.page.value = 3;
    await settle();
    scopeDep.value = 'trash';
    await settle();
    expect(query.page.value).toBe(1);
    expect(lastCall()[0].page).toBe(1);
    expect(lastCall()[1].batchId).toBeUndefined();
  });

  it('debounces search, then resets to page 1 and drops the batch', async () => {
    const { query, spy, lastCall } = setup();
    await settle();
    query.page.value = 2;
    await settle();
    const calls = spy.mock.calls.length;
    query.searchInput.value = 'lo';
    query.searchInput.value = 'logo ';
    await settle();
    expect(spy.mock.calls.length).toBe(calls);
    await settle(30);
    expect(query.search.value).toBe('logo');
    expect(spy.mock.calls.length).toBe(calls + 1);
    expect(lastCall()[0]).toMatchObject({ page: 1, search: 'logo' });
    expect(lastCall()[1].batchId).toBeUndefined();
  });

  it('applies a cleared search without waiting for the debounce', async () => {
    const { query } = setup();
    await settle();
    query.searchInput.value = 'logo';
    await settle(30);
    query.searchInput.value = '';
    await nextTick();
    expect(query.search.value).toBe('');
  });

  it('retries once on a fresh batch when a batched request 400s', async () => {
    const { query, spy, lastCall } = setup(async (state, { batchId }) => {
      if (batchId) throw Object.assign(new Error('Batch'), { statusCode: 400 });
      return page(state, 'b2');
    });
    await settle();
    const calls = spy.mock.calls.length;
    query.page.value = 2;
    await settle();
    expect(spy.mock.calls.length).toBe(calls + 2);
    expect(spy.mock.calls[calls]![1].batchId).toBe('b2');
    expect(lastCall()[1].batchId).toBeUndefined();
    expect(query.error.value).toBeUndefined();
    expect(query.items.value).toEqual([{ id: 'row-2' }]);
  });

  it('sets error without retrying on any other failure', async () => {
    const { query, spy } = setup(async (state, { batchId }) => {
      if (batchId) throw Object.assign(new Error('Boom'), { statusCode: 500 });
      return page(state);
    });
    await settle();
    const calls = spy.mock.calls.length;
    query.page.value = 2;
    await settle();
    expect(spy.mock.calls.length).toBe(calls + 1);
    expect(query.error.value).toBeTruthy();
  });

  it('lets the last request win and aborts the stale one', async () => {
    const slow = deferred<BatchQueryResult<Row>>();
    const signals: AbortSignal[] = [];
    const { query } = setup(async (state, { signal }) => {
      signals.push(signal!);
      if (state.page === 2) return slow.promise;
      return page(state);
    });
    await settle();
    query.page.value = 2;
    await settle();
    query.page.value = 3;
    await settle();
    slow.resolve({
      _id: 'b1',
      page: 2,
      pageSize: 10,
      totalItemCount: 100,
      pageCount: 10,
      items: [{ id: 'row-2' }],
    });
    await settle();
    expect(signals[1]!.aborted).toBe(true);
    expect(query.items.value).toEqual([{ id: 'row-3' }]);
  });

  it('keeps the previous rows while the next page loads', async () => {
    const next = deferred<BatchQueryResult<Row>>();
    const { query } = setup(async (state) =>
      state.page === 2 ? next.promise : page(state),
    );
    await settle();
    query.page.value = 2;
    await settle();
    expect(query.pending.value).toBe(true);
    expect(query.items.value).toEqual([{ id: 'row-1' }]);
    next.resolve({
      _id: 'b1',
      page: 2,
      pageSize: 10,
      totalItemCount: 100,
      pageCount: 10,
      items: [{ id: 'row-2' }],
    });
    await settle();
    expect(query.pending.value).toBe(false);
    expect(query.items.value).toEqual([{ id: 'row-2' }]);
  });

  it('steps to the last page when the set shrank below the current page', async () => {
    const { query, lastCall } = setup(async (state) => page(state, 'b1', 2));
    await settle();
    query.page.value = 5;
    await settle();
    expect(query.page.value).toBe(2);
    expect(lastCall()[0].page).toBe(2);
    expect(query.items.value).toEqual([{ id: 'row-2' }]);
  });

  it('refresh keeps page, sort and search but drops the batch', async () => {
    const { query, lastCall } = setup();
    await settle();
    query.sort.value = { field: 'name', direction: 'desc' };
    query.searchInput.value = 'logo';
    await settle(30);
    query.page.value = 3;
    await settle();
    expect(lastCall()[1].batchId).toBe('b1');
    await query.refresh();
    await settle();
    expect(lastCall()[0]).toMatchObject({
      page: 3,
      search: 'logo',
      sort: { field: 'name', direction: 'desc' },
    });
    expect(lastCall()[1].batchId).toBeUndefined();
  });

  it('drops the batch when refreshed via refreshNuxtData(key)', async () => {
    const { query, lastCall } = setup();
    await settle();
    query.page.value = 3;
    await settle();
    expect(lastCall()[1].batchId).toBe('b1');
    await refreshNuxtData(`list-query-test-${seq}`);
    await settle();
    expect(lastCall()[0]).toMatchObject({ page: 3 });
    expect(lastCall()[1].batchId).toBeUndefined();
  });

  it('keeps the batch when another key is refreshed', async () => {
    const { query, spy, lastCall } = setup();
    await settle();
    query.page.value = 2;
    await settle();
    const calls = spy.mock.calls.length;
    await refreshNuxtData('some-other-list');
    query.page.value = 3;
    await settle();
    expect(spy.mock.calls.length).toBe(calls + 1);
    expect(lastCall()[1].batchId).toBe('b1');
  });

  it('falls back to the default page size for a disallowed value', async () => {
    const { query } = setup();
    query.pageSize.value = 15;
    expect(query.pageSize.value).toBe(10);
    query.pageSize.value = 20;
    expect(query.pageSize.value).toBe(20);
  });

  it('flags an active query from search or any set filter', async () => {
    const { query } = setup();
    expect(query.hasActiveQuery.value).toBe(false);
    query.setFilter('types', []);
    expect(query.hasActiveQuery.value).toBe(false);
    query.setFilter('owner', 'olivia');
    expect(query.hasActiveQuery.value).toBe(true);
    query.resetFilters();
    expect(query.filters.value).toEqual({});
    expect(query.hasActiveQuery.value).toBe(false);
  });

  it('adapts pagination to TanStack 0-based state', async () => {
    const { query } = setup();
    query.page.value = 3;
    expect(query.pagination.value).toEqual({ pageIndex: 2, pageSize: 10 });
    query.pagination.value = { pageIndex: 4, pageSize: 10 };
    expect(query.page.value).toBe(5);
    // A size change goes back to page 1, whatever pageIndex TanStack computed.
    query.pagination.value = { pageIndex: 2, pageSize: 20 };
    expect(query.pageSize.value).toBe(20);
    expect(query.page.value).toBe(1);
  });

  it('adapts sorting to a single-column TanStack state', async () => {
    const { query } = setup();
    expect(query.sorting.value).toEqual([]);
    query.sorting.value = [
      { id: 'name', desc: true },
      { id: 'type', desc: false },
    ];
    expect(query.sort.value).toEqual({ field: 'name', direction: 'desc' });
    expect(query.sorting.value).toEqual([{ id: 'name', desc: true }]);
    query.sorting.value = [];
    expect(query.sort.value).toBeNull();
  });
});
