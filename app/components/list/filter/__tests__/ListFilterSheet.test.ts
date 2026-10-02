/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  defineComponent,
  effectScope,
  h,
  nextTick,
  reactive,
  ref,
  watch,
  type EffectScope,
} from 'vue';
import type {
  BatchQueryResult,
  ListDateRange,
  ListFilterDefinition,
} from '#shared/types';
import { listFilterRouteParams } from '#shared/utils/list-filter';
import type { UseListFiltersReturnType } from '@/composables/useListFilters';

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
import { ListFilterSheet } from '#components';

const EXTRA = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'] as const;

type Filters = {
  types?: string[];
  channels?: string[];
  owners?: string[];
  tags?: string[];
  modified?: ListDateRange;
} & Partial<Record<(typeof EXTRA)[number], string[]>>;

const options = (...values: string[]) =>
  values.map((value) => ({ value, label: value }));

const definitions: ListFilterDefinition<Filters>[] = [
  {
    name: 'types',
    label: 'type',
    kind: 'multiselect',
    options: options('image', 'video'),
  },
  {
    name: 'channels',
    label: 'channel',
    kind: 'multiselect',
    options: options('web'),
  },
  {
    name: 'owners',
    label: 'owner',
    kind: 'multiselect',
    options: options('me'),
    pinnable: false,
  },
  { name: 'tags', label: 'tag', kind: 'multiselect', options: options('a') },
  { name: 'modified', label: 'modified', kind: 'dateRange' },
];

// The real SheetContent teleports to document.body, out of the wrapper's reach.
const stubs = { SheetContent: { template: '<div><slot /></div>' } };

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
  const commits = ref(0);
  scope = effectScope();
  const listFilters = scope.run(() => {
    watch(filters, () => commits.value++);
    return useListFilters<Filters>({ definitions, filters });
  })!;
  return { filters, commits, listFilters };
}

// A host owns `open`, as a page's `v-model:open` would.
async function mount(listFilters: UseListFiltersReturnType<Filters>) {
  const open = ref(true);
  const Host = defineComponent({
    setup: () => () =>
      h(ListFilterSheet, {
        listFilters,
        open: open.value,
        'onUpdate:open': (value: boolean) => (open.value = value),
      }),
  });
  const wrapper = await mountWithContext(Host, { global: { stubs } });
  const setOpen = async (value: boolean) => {
    open.value = value;
    await nextTick();
  };
  return { wrapper, open, setOpen };
}

type Wrapper = Awaited<ReturnType<typeof mount>>['wrapper'];

const rows = (wrapper: Wrapper) =>
  wrapper.findAll('[data-test="list-filter-sheet-row"]');
const option = (wrapper: Wrapper, index: number) =>
  wrapper.findAll('[role="option"]')[index]!;
const buttonByText = (wrapper: Wrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!;

describe('ListFilterSheet', () => {
  it('preselects the first definition', async () => {
    const { listFilters } = setup();
    const { wrapper } = await mount(listFilters);
    expect(rows(wrapper)[0]!.classes()).toContain('bg-secondary');
    expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toEqual([
      'image',
      'video',
    ]);
  });

  it('shows the selected definition', async () => {
    const { listFilters } = setup();
    const { wrapper } = await mount(listFilters);
    await rows(wrapper)[4]!.trigger('click');
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(4);
  });

  it('searches the filters only past 10 definitions', async () => {
    const { listFilters } = setup();
    const { wrapper } = await mount(listFilters);
    expect(wrapper.find('input').exists()).toBe(false);

    const many: ListFilterDefinition<Filters>[] = [
      ...definitions,
      ...EXTRA.map((name) => ({
        name,
        label: name,
        kind: 'multiselect' as const,
        options: [],
      })),
    ];
    const longList = scope!.run(() =>
      useListFilters<Filters>({ definitions: many, filters: ref({}) }),
    )!;
    const { wrapper: long } = await mount(longList);
    await long.find('input').setValue('chan');
    expect(rows(long).map((r) => r.text())).toEqual(['channel']);
  });

  it('stages edits and commits them once on Apply', async () => {
    const { filters, commits, listFilters } = setup();
    const { wrapper, open } = await mount(listFilters);

    await option(wrapper, 0).trigger('click');
    await option(wrapper, 1).trigger('click');
    expect(filters.value).toEqual({});
    expect(rows(wrapper)[0]!.text()).toContain('2');

    await wrapper
      .find('[data-test="list-filter-sheet-apply"]')
      .trigger('click');
    await flushPromises();
    expect(filters.value).toEqual({ types: ['image', 'video'] });
    expect(commits.value).toBe(1);
    expect(open.value).toBe(false);
  });

  it('discards staged edits on Cancel', async () => {
    const { filters, listFilters } = setup({ types: ['image'] });
    const { wrapper, open, setOpen } = await mount(listFilters);

    await option(wrapper, 1).trigger('click');
    await buttonByText(wrapper, 'cancel').trigger('click');
    expect(open.value).toBe(false);
    expect(filters.value).toEqual({ types: ['image'] });

    await setOpen(true);
    expect(rows(wrapper)[0]!.text()).toContain('1');
  });

  it('reseeds from the committed state on reopen', async () => {
    const { listFilters } = setup();
    const { wrapper, setOpen } = await mount(listFilters);
    await setOpen(false);
    listFilters.toggleValue('channels', 'web');
    await setOpen(true);
    expect(rows(wrapper)[1]!.text()).toContain('1');
  });

  it('pins immediately and stops at the limit', async () => {
    const { listFilters } = setup();
    const { wrapper } = await mount(listFilters);
    const pins = () => wrapper.findAll('[data-test="list-filter-sheet-pin"]');
    // `owners` isn't pinnable, so it has no toggle.
    expect(pins()).toHaveLength(4);

    await pins()[0]!.trigger('click');
    await pins()[1]!.trigger('click');
    await pins()[2]!.trigger('click');
    expect(listFilters.pinned.value).toEqual(['types', 'channels', 'tags']);
    expect(pins()[3]!.attributes('aria-disabled')).toBe('true');

    await pins()[3]!.trigger('click');
    expect(listFilters.pinned.value).toEqual(['types', 'channels', 'tags']);

    await pins()[0]!.trigger('click');
    expect(listFilters.pinned.value).toEqual(['channels', 'tags']);
    expect(pins()[3]!.attributes('aria-disabled')).toBeUndefined();
  });
});

describe('ListFilterSheet with useListQuery', () => {
  it('writes the URL only on Apply', async () => {
    scope = effectScope();
    const listFilters = scope.run(() => {
      const query = useListQuery<string, Filters>({
        key: 'list-filter-sheet-test',
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
      });
    })!;
    const { wrapper } = await mount(listFilters);
    await flushPromises();

    await option(wrapper, 1).trigger('click');
    await rows(wrapper)[4]!.trigger('click');
    await wrapper.find('[role="radio"]').trigger('click');
    await flushPromises();
    expect(mocks.route.query).toEqual({});

    await wrapper
      .find('[data-test="list-filter-sheet-apply"]')
      .trigger('click');
    await flushPromises();
    expect(mocks.route.query).toEqual({ types: 'video', modified: 'today' });
  });
});
