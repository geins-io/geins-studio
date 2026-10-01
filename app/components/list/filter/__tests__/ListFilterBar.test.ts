/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { effectScope, h, reactive, ref, type EffectScope } from 'vue';
import type {
  BatchQueryResult,
  ListDateRange,
  ListFilterDefinition,
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
mockNuxtImport(
  'useCookie',
  () => (name: string, opts?: { default?: () => unknown }) => {
    if (!mocks.cookies.has(name))
      mocks.cookies.set(name, ref(opts?.default?.()));
    return mocks.cookies.get(name);
  },
);

import { mountWithContext } from '../../../../../test/helpers';
import { ListFilterBar, TableView } from '#components';

interface Filters {
  types?: string[];
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
  { name: 'modified', label: 'modified', kind: 'dateRange' },
];

// The real PopoverContent teleports to document.body, out of the wrapper's
// reach; inline, its body is always rendered.
const stubs = { PopoverContent: { template: '<div><slot /></div>' } };

let scope: EffectScope | undefined;

beforeEach(() => {
  mocks.cookies.clear();
  mocks.route = reactive(mocks.routeShape());
  // `mountSuspended` navigates through the router too, without a query.
  mocks.replace = vi.fn(({ query }: { query?: Record<string, string> }) => {
    if (query) mocks.route.query = query;
    return Promise.resolve();
  });
});

afterEach(() => {
  scope?.stop();
  scope = undefined;
});

function setup(initial: Filters = {}) {
  const filters = ref<Filters>(initial);
  scope = effectScope();
  const listFilters = scope.run(() =>
    useListFilters<Filters>({
      definitions,
      filters,
      defaultPinned: ['types', 'modified'],
    }),
  )!;
  return { filters, listFilters };
}

const mount = (listFilters: ReturnType<typeof setup>['listFilters']) =>
  mountWithContext(ListFilterBar, {
    props: { listFilters },
    global: { stubs },
  });

describe('ListFilterBar', () => {
  it('renders the pinned filters in pinned order', async () => {
    const { listFilters } = setup();
    listFilters.togglePin('types');
    listFilters.togglePin('types');
    const wrapper = await mount(listFilters);
    const pinned = wrapper.findAll('[data-test="list-filter-pinned"]');
    expect(pinned.map((p) => p.text())).toEqual(['modified', 'type']);
  });

  it('hides "Clear all filters" while nothing is active', async () => {
    const { listFilters } = setup();
    const wrapper = await mount(listFilters);
    expect(wrapper.find('[data-test="list-filter-clear-all"]').exists()).toBe(
      false,
    );

    listFilters.toggleValue('types', 'image');
    await flushPromises();
    expect(wrapper.find('[data-test="list-filter-clear-all"]').exists()).toBe(
      true,
    );
  });

  it('shows the active count on a pinned button and on "All filters"', async () => {
    const { listFilters } = setup({
      types: ['image', 'video'],
      modified: { preset: 'week' },
    });
    const wrapper = await mount(listFilters);
    const badge = wrapper
      .find('[data-test="list-filter-pinned"]')
      .find('[data-slot="badge"]');
    expect(badge.text()).toBe('2');
    expect(badge.attributes('aria-label')).toBe('count_selected');
    expect(
      wrapper
        .find('[data-test="list-filter-all"]')
        .find('[data-slot="badge"]')
        .text(),
    ).toBe('2');
  });

  it('emits open-all from "All filters"', async () => {
    const { listFilters } = setup();
    const wrapper = await mount(listFilters);
    await wrapper.find('[data-test="list-filter-all"]').trigger('click');
    expect(wrapper.emitted('open-all')).toHaveLength(1);
  });

  it('clears one filter from its popover', async () => {
    const { filters, listFilters } = setup({
      types: ['image'],
      modified: { preset: 'today' },
    });
    const wrapper = await mount(listFilters);
    const clear = wrapper
      .findAll('button')
      .find((b) => b.text() === 'clear' && !b.attributes('disabled'))!;
    await clear.trigger('click');
    expect(filters.value).toEqual({ modified: { preset: 'today' } });
  });
});

describe('ListFilterBar with useListQuery', () => {
  it('writes a pinned-filter toggle to the URL and clears it again', async () => {
    scope = effectScope();
    const listFilters = scope.run(() => {
      const query = useListQuery<string, Filters>({
        key: 'list-filter-bar-test',
        fetcher: async (state): Promise<BatchQueryResult<string>> => ({
          _id: 'b1',
          page: state.page,
          pageSize: state.pageSize,
          totalItemCount: 0,
          pageCount: 0,
          items: [],
        }),
        defaults: { filters: {} },
        route: { filters: listFilterRouteParams(definitions) },
      });
      return useListFilters<Filters>({
        definitions,
        filters: query.filters,
        resetFilters: query.resetFilters,
        defaultPinned: ['types'],
      });
    })!;
    const wrapper = await mount(listFilters);
    await flushPromises();

    await wrapper.findAll('[role="option"]')[1]!.trigger('click');
    await flushPromises();
    expect(mocks.route.query).toEqual({ types: 'video' });

    await wrapper.find('[data-test="list-filter-clear-all"]').trigger('click');
    await flushPromises();
    expect(mocks.route.query).toEqual({});
  });
});

describe('TableView toolbar slot', () => {
  it('renders the toolbar beside the search', async () => {
    const wrapper = await mountWithContext(TableView, {
      props: { columns: [], data: [] },
      slots: { toolbar: () => h('span', { 'data-test': 'bar' }, 'bar') },
    });
    const toolbar = wrapper.find('[data-test="table-toolbar"]');
    expect(toolbar.find('[data-test="bar"]').exists()).toBe(true);
  });

  it('renders no toolbar wrapper without the slot', async () => {
    const wrapper = await mountWithContext(TableView, {
      props: { columns: [], data: [] },
    });
    expect(wrapper.find('[data-test="table-toolbar"]').exists()).toBe(false);
  });
});
