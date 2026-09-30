/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { effectScope, nextTick, reactive, type EffectScope } from 'vue';
import { flushPromises } from '@vue/test-utils';
import type { BatchQueryResult, ListQueryState } from '#shared/types';
import { listParam } from '#shared/utils/list-query';

interface MockRoute {
  query: Record<string, string>;
}

// Plugins read more of the route than `query` (e.g. `meta`) at app init, so it
// carries the full shape from the start.
const mocks = vi.hoisted(() => {
  const routeShape = () => ({
    path: '/',
    fullPath: '/',
    hash: '',
    name: undefined,
    params: {},
    meta: {},
    matched: [],
    query: {} as Record<string, string>,
  });
  return {
    routeShape,
    route: routeShape() as MockRoute,
    replace: vi.fn(),
  };
});

mockNuxtImport('useRoute', () => () => mocks.route);
mockNuxtImport<typeof useRouter>('useRouter', (original) => () => ({
  ...original(),
  replace: mocks.replace,
}));

import { useListQuery } from '../useListQuery';

interface Filters {
  types?: ('image' | 'video')[];
}

let seq = 0;
let scope: EffectScope | undefined;

beforeEach(() => {
  mocks.route = reactive(mocks.routeShape());
  mocks.replace = vi.fn(({ query }: MockRoute) => {
    mocks.route.query = query;
    return Promise.resolve();
  });
});

afterEach(() => {
  scope?.stop();
  scope = undefined;
});

const settle = async (ms = 0) => {
  for (let i = 0; i < 3; i++) {
    await flushPromises();
    await new Promise((r) => setTimeout(r, ms));
  }
  await nextTick();
};

function setup(query: Record<string, string> = {}, keys = {}) {
  mocks.route.query = query;
  const fetcher = vi.fn(
    async (
      state: ListQueryState<Filters>,
    ): Promise<BatchQueryResult<string>> => ({
      _id: 'b1',
      page: state.page,
      pageSize: state.pageSize,
      totalItemCount: 1000,
      pageCount: 100,
      items: [],
    }),
  );
  scope = effectScope();
  const list = scope.run(() =>
    useListQuery<string, Filters>({
      key: `list-query-route-test-${++seq}`,
      fetcher,
      defaults: { filters: {}, pageSize: 24 },
      pageSizes: [24, 48],
      searchDebounceMs: 20,
      route: {
        keys,
        sortFields: ['name', 'updatedAt'],
        filters: { types: listParam(['image', 'video'] as const) },
      },
    }),
  )!;
  return { list, fetcher };
}

describe('useListQuery route sync', () => {
  it('restores the state from the URL before the first fetch', async () => {
    const query = {
      page: '3',
      perPage: '48',
      sort: '-name',
      q: 'logo',
      types: 'image,video',
    };
    const { list, fetcher } = setup(query);
    await settle();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![0]).toEqual({
      page: 3,
      pageSize: 48,
      sort: { field: 'name', direction: 'desc' },
      search: 'logo',
      filters: { types: ['image', 'video'] },
    });
    expect(list.searchInput.value).toBe('logo');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('drops invalid URL values and cleans them out of the URL', async () => {
    const { fetcher } = setup({
      page: 'abc',
      perPage: '15',
      sort: '-bogus',
      types: 'pdf,image',
    });
    await settle();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![0]).toEqual({
      page: 1,
      pageSize: 24,
      sort: null,
      search: '',
      filters: { types: ['image'] },
    });
    expect(mocks.replace).toHaveBeenCalledWith({ query: { types: 'image' } });
  });

  it('writes changes with replace and omits defaults', async () => {
    const { list } = setup();
    await settle();
    list.page.value = 2;
    await settle();
    expect(mocks.replace).toHaveBeenLastCalledWith({ query: { page: '2' } });
    list.sort.value = { field: 'updatedAt', direction: 'asc' };
    await settle();
    // The sort change reset the page, so `page` leaves the URL.
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: { sort: 'updatedAt' },
    });
  });

  it('writes the search only after the debounce', async () => {
    const { list } = setup();
    await settle();
    list.searchInput.value = 'lo';
    await settle();
    expect(mocks.replace).not.toHaveBeenCalled();
    await settle(30);
    expect(mocks.replace).toHaveBeenLastCalledWith({ query: { q: 'lo' } });
  });

  it('leaves unrelated query params alone', async () => {
    const { list } = setup({ folder: 'f1' });
    await settle();
    list.setFilter('types', ['video']);
    await settle();
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: { folder: 'f1', types: 'video' },
    });
  });

  it('follows back / forward navigation and refetches', async () => {
    const { list, fetcher } = setup({ sort: 'name' });
    await settle();
    mocks.route.query = { page: '4', sort: 'name' };
    await settle();
    expect(list.page.value).toBe(4);
    expect(fetcher.mock.calls.at(-1)![0]).toMatchObject({
      page: 4,
      sort: { field: 'name', direction: 'asc' },
    });
    mocks.route.query = { q: 'hero' };
    await settle();
    expect(list.sort.value).toBeNull();
    expect(list.search.value).toBe('hero');
    expect(list.page.value).toBe(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('uses overridden keys so two lists can share a page', async () => {
    const { fetcher } = setup({ p: '2', page: '9' }, { page: 'p' });
    await settle();
    expect(fetcher.mock.calls[0]![0].page).toBe(2);
  });
});
