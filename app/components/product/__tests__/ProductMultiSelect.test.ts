import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { ProductMultiSelect } from '#components';

const products = [
  { _id: '1001', name: 'Monstera', articleNumber: 'MON-1' },
  { _id: '1002', name: 'Ficus', articleNumber: 'FIC-1' },
  { _id: '1003', name: 'Pilea', articleNumber: 'PIL-1' },
];

const rows = (wrapper: Awaited<ReturnType<typeof mountWithContext>>) =>
  wrapper.findAll('[data-test="product-multi-select-row"]');

describe('ProductMultiSelect', () => {
  it('lists every product with its refs', async () => {
    const wrapper = await mountWithContext(ProductMultiSelect, {
      props: { products, modelValue: [] },
    });
    expect(rows(wrapper)).toHaveLength(3);
    expect(wrapper.text()).toContain('MON-1 · 1001');
  });

  it('filters on name, article number and id', async () => {
    const wrapper = await mountWithContext(ProductMultiSelect, {
      props: { products, modelValue: [] },
    });
    const input = wrapper.find('input');
    await input.setValue('fic');
    expect(rows(wrapper)).toHaveLength(1);
    await input.setValue('PIL-1');
    expect(wrapper.text()).toContain('Pilea');
    await input.setValue('1001');
    expect(wrapper.text()).toContain('Monstera');
  });

  it('marks locked products with the label', async () => {
    const wrapper = await mountWithContext(ProductMultiSelect, {
      props: {
        products,
        modelValue: [],
        lockedIds: ['1002'],
        lockedLabel: 'Linked',
      },
    });
    const ficus = rows(wrapper).find((row) => row.text().includes('Ficus'));
    expect(ficus?.text()).toContain('Linked');
    expect(ficus?.attributes('data-disabled')).toBeDefined();
  });
});
