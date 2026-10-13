import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { ProductMultiSelect } from '#components';

const products = [
  { _id: '1001', name: 'Monstera', articleNumber: 'MON-1' },
  { _id: '1002', name: 'Ficus', articleNumber: 'FIC-1' },
  { _id: '1003', name: 'Pilea', articleNumber: 'PIL-1' },
];

// Stands in for the products store: knows one product the picker isn't given.
const catalogue = [
  ...products,
  { _id: '2001', name: 'Hidden', articleNumber: 'HID-1' },
];
const matchPending = vi.hoisted(() => ({ value: false }));
mockNuxtImport('useProductMatch', () => () => ({
  pending: matchPending,
  matchById: (ref: string) =>
    catalogue.find((p) =>
      [p._id, p.articleNumber].some(
        (k) => k.toLowerCase() === ref.toLowerCase(),
      ),
    ) ?? null,
}));

type Wrapper = Awaited<ReturnType<typeof mountWithContext>>;

// The results popover portals out of the wrapper (and only opens on real
// focus); render its content in place.
const mount = (props: Record<string, unknown>) =>
  mountWithContext(ProductMultiSelect, {
    props: { products, modelValue: [], ...props },
    global: { stubs: { PopoverContent: { template: '<div><slot /></div>' } } },
  });

const results = (wrapper: Wrapper) =>
  wrapper.findAll('[data-test="product-multi-select-result"]');
const rows = (wrapper: Wrapper) =>
  wrapper.findAll('[data-test="product-multi-select-row"]');
const lastModel = (wrapper: Wrapper) =>
  wrapper.emitted('update:modelValue')?.at(-1);
const search = (wrapper: Wrapper, term: string) =>
  wrapper.find('[data-test="product-multi-select-search"]').setValue(term);

describe('ProductMultiSelect search', () => {
  it('shows no results until the user searches', async () => {
    const wrapper = await mount({});
    expect(results(wrapper)).toHaveLength(0);
  });

  it('matches on name, article number and id', async () => {
    const wrapper = await mount({});
    await search(wrapper, 'fic');
    expect(results(wrapper)).toHaveLength(1);
    await search(wrapper, 'PIL-1');
    expect(results(wrapper)[0]!.text()).toContain('Pilea');
    await search(wrapper, '1001');
    expect(results(wrapper)[0]!.text()).toContain('MON-1 · 1001');
  });

  it('marks locked products with the label', async () => {
    const wrapper = await mount({ lockedIds: ['1002'], lockedLabel: 'Linked' });
    await search(wrapper, 'ficus');
    expect(results(wrapper)[0]!.text()).toContain('Linked');
    expect(results(wrapper)[0]!.attributes('data-disabled')).toBeDefined();
  });
});

describe('ProductMultiSelect selection', () => {
  it('lists only the selected products, each removable', async () => {
    const wrapper = await mount({ modelValue: ['1001', '1003'] });
    expect(rows(wrapper)).toHaveLength(2);
    expect(rows(wrapper)[0]!.text()).toContain('Monstera');

    await rows(wrapper)[0]!
      .find('[data-test="product-multi-select-remove"]')
      .trigger('click');
    expect(lastModel(wrapper)).toEqual([['1003']]);
  });

  const paste = async (wrapper: Wrapper, text: string) => {
    await wrapper
      .find('input[data-test="product-multi-select-paste"]')
      .setValue(text);
    await wrapper
      .find('[data-test="product-multi-select-paste-apply"]')
      .trigger('click');
    return lastModel(wrapper);
  };

  it('adds pasted refs and flags the unmatched ones', async () => {
    const wrapper = await mount({ modelValue: ['1003'], lockedIds: ['1002'] });
    expect(await paste(wrapper, 'MON-1, FIC-1 OOPS')).toEqual([
      ['1003', '1001'],
    ]);
    expect(
      wrapper.find('[data-test="product-multi-select-not-found"]').exists(),
    ).toBe(true);
  });

  it('replaces the selection with pasted refs', async () => {
    const wrapper = await mount({ modelValue: ['1003'] });
    await wrapper
      .find('[data-test="product-multi-select-paste-replace"]')
      .trigger('click');
    expect(await paste(wrapper, 'mon-1')).toEqual([['1001']]);
  });

  it('only selects products the picker lists', async () => {
    const wrapper = await mount({});
    expect(await paste(wrapper, 'MON-1 HID-1')).toEqual([['1001']]);
    expect(
      wrapper.find('[data-test="product-multi-select-not-found"]').exists(),
    ).toBe(true);
  });

  it('disables paste until the products store is ready', async () => {
    matchPending.value = true;
    const wrapper = await mount({});
    await wrapper
      .find('input[data-test="product-multi-select-paste"]')
      .setValue('MON-1');
    expect(
      wrapper
        .find('[data-test="product-multi-select-paste-apply"]')
        .attributes('disabled'),
    ).toBeDefined();
    matchPending.value = false;
  });
});
