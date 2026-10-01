import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, afterEach } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';
import type {
  ListDateRange,
  ListFilterDefinition,
  ListFilterMultiselectDefinition,
  ListFilterOption,
} from '#shared/types';
import { mountWithContext } from '../../../../../test/helpers';
import { ListFilterValues } from '#components';

interface Filters {
  types?: string[];
  modified?: ListDateRange;
}

const typeOptions: ListFilterOption[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
];
const types: ListFilterMultiselectDefinition<Filters> = {
  name: 'types',
  label: 'type',
  kind: 'multiselect',
  options: typeOptions,
};
const modified: ListFilterDefinition<Filters> = {
  name: 'modified',
  label: 'modified',
  kind: 'dateRange',
};

let scope: EffectScope | undefined;
afterEach(() => {
  scope?.stop();
  scope = undefined;
});

function setup(definitions: ListFilterDefinition<Filters>[]) {
  const filters = ref<Filters>({});
  scope = effectScope();
  const listFilters = scope.run(() =>
    useListFilters<Filters>({ definitions, filters }),
  )!;
  return { filters, listFilters };
}

const mount = (
  definition: ListFilterDefinition<Filters> | undefined,
  listFilters: ReturnType<typeof setup>['listFilters'],
) => mountWithContext(ListFilterValues, { props: { definition, listFilters } });

const optionLabels = (wrapper: Awaited<ReturnType<typeof mount>>) =>
  wrapper.findAll('[role="option"]').map((o) => o.text());

describe('ListFilterValues', () => {
  it('prompts to select a filter without a definition', async () => {
    const { listFilters } = setup([types]);
    const wrapper = await mount(undefined, listFilters);
    expect(wrapper.text()).toBe('select_a_filter');
  });

  it('renders the editor for the kind', async () => {
    const { listFilters } = setup([types, modified]);
    const multi = await mount(types, listFilters);
    expect(optionLabels(multi)).toEqual(['Image', 'Video', 'PDF']);
    const range = await mount(modified, listFilters);
    expect(range.findAll('[role="radio"]')).toHaveLength(4);
  });
});

describe('ListFilterMultiSelect', () => {
  it('toggles values on the filter state', async () => {
    const { filters, listFilters } = setup([types]);
    const wrapper = await mount(types, listFilters);
    const video = () => wrapper.findAll('[role="option"]')[1]!;

    await video().trigger('click');
    expect(filters.value).toEqual({ types: ['video'] });
    expect(
      video().find('[data-slot="checkbox"]').attributes('data-state'),
    ).toBe('checked');

    await video().trigger('click');
    expect(filters.value).toEqual({});
  });

  it('hides the search for a short list', async () => {
    const { listFilters } = setup([types]);
    const wrapper = await mount(types, listFilters);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('filters options locally and shows the empty text', async () => {
    const searchable = { ...types, searchable: true };
    const { listFilters } = setup([searchable]);
    const wrapper = await mount(searchable, listFilters);
    const input = wrapper.find('input');

    await input.setValue('vi');
    expect(optionLabels(wrapper)).toEqual(['Video']);

    await input.setValue('zzz');
    expect(optionLabels(wrapper)).toEqual([]);
    expect(wrapper.text()).toContain('no_entity_found');
  });

  it('keeps the search after a toggle', async () => {
    const searchable = { ...types, searchable: true };
    const { filters, listFilters } = setup([searchable]);
    const wrapper = await mount(searchable, listFilters);
    await wrapper.find('input').setValue('vi');
    await wrapper.find('[role="option"]').trigger('click');
    expect(filters.value).toEqual({ types: ['video'] });
    expect(optionLabels(wrapper)).toEqual(['Video']);
  });

  it('turns searchable past 7 options by default', async () => {
    const many = {
      ...types,
      options: Array.from({ length: 8 }, (_, i) => ({
        value: `v${i}`,
        label: `Option ${i}`,
      })),
    };
    const { listFilters } = setup([many]);
    const wrapper = await mount(many, listFilters);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('shows an error with retry for async options', async () => {
    let fail = true;
    const asyncTypes = {
      ...types,
      options: async () => {
        if (fail) throw new Error('down');
        return typeOptions;
      },
    };
    const { listFilters } = setup([asyncTypes]);
    const wrapper = await mount(asyncTypes, listFilters);
    await flushPromises();
    expect(wrapper.text()).toContain('failed_to_fetch_entity');

    fail = false;
    const retry = wrapper.findAll('button').find((b) => b.text() === 'retry');
    await retry!.trigger('click');
    await flushPromises();
    await nextTick();
    expect(optionLabels(wrapper)).toEqual(['Image', 'Video', 'PDF']);
  });
});

describe('ListFilterDateRange', () => {
  it('stores a picked preset', async () => {
    const { filters, listFilters } = setup([modified]);
    const wrapper = await mount(modified, listFilters);
    await wrapper.findAll('[role="radio"]')[1]!.trigger('click');
    expect(filters.value).toEqual({ modified: { preset: 'week' } });
  });

  it('reveals the calendar for a custom range without writing yet', async () => {
    const { filters, listFilters } = setup([modified]);
    const wrapper = await mount(modified, listFilters);
    expect(wrapper.find('[data-slot="range-calendar"]').exists()).toBe(false);
    await wrapper.findAll('[role="radio"]')[3]!.trigger('click');
    expect(wrapper.find('[data-slot="range-calendar"]').exists()).toBe(true);
    expect(filters.value).toEqual({});
  });
});
