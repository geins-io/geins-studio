/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { effectScope, reactive, ref, type EffectScope, type Ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import type {
  BatchQueryResult,
  ListDateRange,
  ListFilterDefinition,
  ListQueryState,
} from '#shared/types';
import { listFilterRouteParams } from '#shared/utils/list-filter';

const mocks = vi.hoisted(() => {
  const routeShape = () => ({
    path: '/assets',
    fullPath: '/assets',
    hash: '',
    name: undefined,
    params: {},
    meta: {},
    matched: [],
    query: {} as Record<string, string>,
  });
  return {
    routeShape,
    route: routeShape(),
    cookies: new Map<string, { value: unknown }>(),
    replace: vi.fn(),
  };
});

mockNuxtImport('useRoute', () => () => mocks.route);
mockNuxtImport<typeof useRouter>('useRouter', (original) => () => ({
  ...original(),
  replace: mocks.replace,
}));
mockNuxtImport('useUserStore', () => () => ({ user: { _id: 'u1' } }));
mockNuxtImport('useCookie', () => (name: string) => {
  if (!mocks.cookies.has(name)) mocks.cookies.set(name, ref(undefined));
  return mocks.cookies.get(name);
});

import { useListFilters } from '../useListFilters';
import { useListQuery } from '../useListQuery';

interface Filters {
  types?: string[];
  channels?: string[];
  owners?: string[];
  modified?: ListDateRange;
}

const definitions: ListFilterDefinition<Filters>[] = [
  {
    name: 'types',
    label: 'type',
    kind: 'multiselect',
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
    ],
  },
  { name: 'channels', label: 'channel', kind: 'multiselect', options: [] },
  {
    name: 'owners',
    label: 'owner',
    kind: 'multiselect',
    options: [],
    pinnable: false,
  },
  { name: 'modified', label: 'modified', kind: 'dateRange' },
];

let scope: EffectScope | undefined;

beforeEach(() => {
  mocks.cookies.clear();
  mocks.route = reactive(mocks.routeShape());
  mocks.replace = vi.fn(({ query }: { query: Record<string, string> }) => {
    mocks.route.query = query;
    return Promise.resolve();
  });
});

afterEach(() => {
  scope?.stop();
  scope = undefined;
});

function setup(
  extra: Partial<Parameters<typeof useListFilters<Filters>>[0]> = {},
  filters: Ref<Filters> = ref({}),
) {
  scope = effectScope();
  const list = scope.run(() =>
    useListFilters<Filters>({ definitions, filters, ...extra }),
  )!;
  return { list, filters };
}

describe('useListFilters values', () => {
  it('counts active values per filter and in total', () => {
    const { list } = setup({}, ref({ types: ['image', 'video'] }));
    expect(list.activeCount('types')).toBe(2);
    expect(list.isActive('channels')).toBe(false);
    expect(list.totalActive.value).toBe(1);

    list.setRange('modified', { preset: 'week' });
    expect(list.activeCount('modified')).toBe(1);
    expect(list.totalActive.value).toBe(2);
  });

  it('toggles values and drops the key once empty', () => {
    const { list, filters } = setup();
    list.toggleValue('types', 'image');
    list.toggleValue('types', 'video');
    expect(filters.value).toEqual({ types: ['image', 'video'] });
    list.toggleValue('types', 'image');
    list.toggleValue('types', 'video');
    expect(filters.value).toEqual({});
  });

  it('replaces the state rather than mutating it', () => {
    const { list, filters } = setup();
    const before = filters.value;
    list.toggleValue('types', 'image');
    expect(filters.value).not.toBe(before);
    expect(before).toEqual({});
  });

  it('clears one filter or all of them', () => {
    const { list, filters } = setup(
      {},
      ref({ types: ['image'], modified: { preset: 'today' } }),
    );
    list.clear('modified');
    expect(filters.value).toEqual({ types: ['image'] });
    list.clearAll();
    expect(filters.value).toEqual({});
  });

  it('uses resetFilters for clearAll when given', () => {
    const resetFilters = vi.fn();
    const { list } = setup({ resetFilters }, ref({ types: ['image'] }));
    list.clearAll();
    expect(resetFilters).toHaveBeenCalledOnce();
  });
});

describe('useListFilters pinned', () => {
  const cookieName = 'geins-filters-pinned-u1/assets';

  it('falls back to defaultPinned while no cookie exists', () => {
    const { list } = setup({ defaultPinned: ['types', 'modified'] });
    expect(list.pinned.value).toEqual(['types', 'modified']);
  });

  it('prefers the cookie, even an empty one', () => {
    mocks.cookies.set(cookieName, ref(['channels']));
    expect(setup({ defaultPinned: ['types'] }).list.pinned.value).toEqual([
      'channels',
    ]);
    mocks.cookies.set(cookieName, ref([]));
    expect(setup({ defaultPinned: ['types'] }).list.pinned.value).toEqual([]);
  });

  it('writes pins to a per-user, per-route cookie', () => {
    const { list } = setup();
    list.togglePin('modified');
    list.togglePin('types');
    expect(mocks.cookies.get(cookieName)?.value).toEqual(['modified', 'types']);
    list.togglePin('modified');
    expect(list.pinned.value).toEqual(['types']);
  });

  it('keys the cookie by persistKey when given', () => {
    const { list } = setup({ persistKey: 'trash' });
    list.togglePin('types');
    expect(
      mocks.cookies.get('geins-filters-pinned-trash-u1/assets')?.value,
    ).toEqual(['types']);
  });

  it('stops at 3 pins and skips unpinnable filters', () => {
    const { list } = setup({ defaultPinned: ['types', 'channels'] });
    list.togglePin('owners');
    expect(list.canPin('owners')).toBe(false);
    list.togglePin('modified');
    expect(list.pinned.value).toEqual(['types', 'channels', 'modified']);

    const more: ListFilterDefinition<Filters>[] = [
      ...definitions,
      // A fourth pinnable filter.
      { name: 'owners', label: 'x', kind: 'multiselect', options: [] },
    ];
    const { list: full } = setup({
      definitions: more.filter((d, i) => i !== 2),
      defaultPinned: ['types', 'channels', 'modified'],
    });
    expect(full.canPin('owners')).toBe(false);
    full.togglePin('owners');
    expect(full.pinned.value).toEqual(['types', 'channels', 'modified']);
  });

  it('drops unknown or unpinnable names from the cookie', () => {
    mocks.cookies.set(cookieName, ref(['gone', 'owners', 'types', 'types']));
    expect(setup().list.pinned.value).toEqual(['types']);
  });
});

describe('useListFilters async options', () => {
  it('loads once and retries after an error', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue([{ value: 'se', label: 'Sweden' }]);
    const defs: ListFilterDefinition<Filters>[] = [
      {
        name: 'channels',
        label: 'channel',
        kind: 'multiselect',
        options: loader,
      },
    ];
    const { list } = setup({ definitions: defs });

    const state = list.resolvedOptions('channels');
    expect(state.pending).toBe(true);
    await flushPromises();
    expect(state.error).toBeInstanceOf(Error);
    expect(list.resolvedOptions('channels')).toBe(state);
    expect(loader).toHaveBeenCalledOnce();

    await state.reload();
    expect(state.error).toBeUndefined();
    expect(state.options).toEqual([{ value: 'se', label: 'Sweden' }]);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('returns static options as-is', () => {
    const { list } = setup();
    expect(list.resolvedOptions('types').options).toHaveLength(2);
    expect(list.resolvedOptions('types').pending).toBe(false);
  });
});

describe('useListFilters staging', () => {
  it('keeps edits local until apply', () => {
    const { list, filters } = setup({}, ref({ types: ['image'] }));
    const draft = list.stage();
    draft.toggleValue('types', 'video');
    draft.setRange('modified', { preset: 'today' });
    expect(filters.value).toEqual({ types: ['image'] });
    expect(draft.dirty.value).toBe(true);
    expect(draft.totalActive.value).toBe(2);

    draft.apply();
    expect(filters.value).toEqual({
      types: ['image', 'video'],
      modified: { preset: 'today' },
    });
    expect(draft.dirty.value).toBe(false);
  });

  it('discards back to the committed state', () => {
    const { list, filters } = setup({}, ref({ types: ['image'] }));
    const draft = list.stage();
    draft.clearAll();
    expect(draft.filters.value).toEqual({});
    draft.discard();
    expect(draft.filters.value).toEqual({ types: ['image'] });
    expect(draft.dirty.value).toBe(false);
    expect(filters.value).toEqual({ types: ['image'] });
  });

  it('does not commit an unchanged draft', () => {
    const { list, filters } = setup({}, ref({ types: ['image'] }));
    const before = filters.value;
    const draft = list.stage();
    draft.toggleValue('types', 'video');
    draft.toggleValue('types', 'video');
    draft.apply();
    expect(filters.value).toBe(before);
  });
});

describe('useListFilters with useListQuery', () => {
  it('restores filters from the URL and writes commits back', async () => {
    mocks.route.query = { types: 'video', modified: 'week' };
    const fetcher = vi.fn(
      async (
        state: ListQueryState<Filters>,
      ): Promise<BatchQueryResult<string>> => ({
        _id: 'b1',
        page: state.page,
        pageSize: state.pageSize,
        totalItemCount: 0,
        pageCount: 0,
        items: [],
      }),
    );
    scope = effectScope();
    const { query, list } = scope.run(() => {
      const query = useListQuery<string, Filters>({
        key: 'list-filters-test',
        fetcher,
        defaults: { filters: {} },
        route: { filters: listFilterRouteParams(definitions) },
      });
      const list = useListFilters<Filters>({
        definitions,
        filters: query.filters,
        resetFilters: query.resetFilters,
      });
      return { query, list };
    })!;
    await flushPromises();

    expect(fetcher.mock.calls[0]![0].filters).toEqual({
      types: ['video'],
      modified: { preset: 'week' },
    });
    expect(list.activeCount('types')).toBe(1);

    const draft = list.stage();
    draft.toggleValue('types', 'image');
    await flushPromises();
    expect(mocks.route.query).toEqual({ types: 'video', modified: 'week' });

    draft.apply();
    await flushPromises();
    expect(mocks.route.query).toEqual({
      types: 'video,image',
      modified: 'week',
    });

    list.clearAll();
    await flushPromises();
    expect(mocks.route.query).toEqual({});
    expect(query.hasActiveQuery.value).toBe(false);
  });
});
