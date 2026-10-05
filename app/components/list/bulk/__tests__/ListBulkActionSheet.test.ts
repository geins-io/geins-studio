import { describe, it, expect } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import type { BulkAction } from '#shared/types';
import { mountWithContext } from '../../../../../test/helpers';
import { ListBulkActionSheet } from '#components';

// The real SheetContent teleports to document.body, out of the wrapper's reach.
const ConfirmStub = defineComponent({
  name: 'ListBulkActionConfirm',
  props: ['open', 'action', 'value', 'ids', 'entityKey', 'scopeNote'],
  setup: () => () => h('div'),
});
const stubs = {
  SheetContent: { template: '<div><slot /></div>' },
  ListBulkActionConfirm: ConfirmStub,
};

const TextValue = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h('input', {
        'data-test': 'value',
        value: props.modelValue,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      }),
});

const noop = () => Promise.resolve();
const actions: BulkAction[] = [
  {
    key: 'trash',
    label: 'Move to trash',
    icon: 'Trash2',
    run: noop,
    successMessage: () => 'done',
  },
  {
    key: 'tag',
    label: 'Add tags',
    icon: 'Tag',
    component: TextValue,
    initialValue: () => '',
    isValid: (value) => typeof value === 'string' && value.length > 0,
    run: noop,
    successMessage: () => 'done',
  },
];

async function mount(ids = ['a1', 'a2']) {
  const open = ref(true);
  const Host = defineComponent({
    setup: () => () =>
      h(ListBulkActionSheet, {
        actions,
        ids,
        entityKey: 'asset',
        open: open.value,
        'onUpdate:open': (value: boolean) => (open.value = value),
      }),
  });
  return await mountWithContext(Host, { global: { stubs } });
}

type Wrapper = Awaited<ReturnType<typeof mount>>;
const runButton = (wrapper: Wrapper) =>
  wrapper.find('[data-test="bulk-action-run"]');
const row = (wrapper: Wrapper, index: number) =>
  wrapper.findAll('[data-test="bulk-action-row"]')[index]!;

describe('ListBulkActionSheet', () => {
  it('keeps Run disabled until an action is picked', async () => {
    const wrapper = await mount();
    expect(runButton(wrapper).attributes('disabled')).toBeDefined();
    await row(wrapper, 0).trigger('click');
    expect(runButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it("keeps Run disabled until the action's value is valid", async () => {
    const wrapper = await mount();
    await row(wrapper, 1).trigger('click');
    expect(runButton(wrapper).attributes('disabled')).toBeDefined();
    await wrapper.find('[data-test="value"]').setValue('hero');
    expect(runButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('opens the confirm step with the picked action and value', async () => {
    const wrapper = await mount();
    await row(wrapper, 1).trigger('click');
    await wrapper.find('[data-test="value"]').setValue('hero');
    await runButton(wrapper).trigger('click');
    await nextTick();
    const confirm = wrapper.findComponent(ConfirmStub);
    expect(confirm.props('open')).toBe(true);
    expect(confirm.props('action')).toMatchObject({ key: 'tag' });
    expect(confirm.props('value')).toBe('hero');
    expect(confirm.props('ids')).toEqual(['a1', 'a2']);
  });

  it('resets the value when another action is picked', async () => {
    const wrapper = await mount();
    await row(wrapper, 1).trigger('click');
    await wrapper.find('[data-test="value"]').setValue('hero');
    await row(wrapper, 0).trigger('click');
    await row(wrapper, 1).trigger('click');
    expect(
      (wrapper.find('[data-test="value"]').element as HTMLInputElement).value,
    ).toBe('');
  });
});
