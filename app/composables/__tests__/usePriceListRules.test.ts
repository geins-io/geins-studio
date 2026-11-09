// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import type { PriceListProduct, ProductPriceListUpdate } from '#shared/types';

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError: vi.fn() }));

vi.mock('@/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { usePriceListRules } from '../pricing/usePriceListRules';

function setup() {
  const editedProducts = ref<PriceListProduct[]>([
    { _id: '1', productId: 'p1', price: 100, staggeredCount: 1 },
    { _id: '2', productId: 'p2', discountPercent: 20, staggeredCount: 1 },
    { _id: '3', productId: 'p3', discountPercent: 15, staggeredCount: 5 },
  ]);
  // The editor shares one array between its rows and the draft.
  const entityDataUpdate = ref<ProductPriceListUpdate>({
    products: editedProducts.value,
    rules: [],
  });
  const previewPriceList = vi.fn(() => Promise.resolve());
  const rules = usePriceListRules({
    entityDataUpdate,
    editedProducts,
    previewPriceList,
  });
  return { editedProducts, entityDataUpdate, previewPriceList, rules };
}

describe('usePriceListRules — apply and overwrite', () => {
  it('resets the base rows in the editor rows, keeping volume breaks', async () => {
    const { editedProducts, entityDataUpdate, previewPriceList, rules } =
      setup();

    await rules.applyBaseRuleAndOverwrite(7, 'discount');
    expect(rules.overwriteBaseRulePromptVisible.value).toBe(true);
    await rules.overwriteContinueAction.value();

    expect(editedProducts.value).toEqual([
      { productId: 'p1', staggeredCount: 1 },
      { productId: 'p2', staggeredCount: 1 },
      { _id: '3', productId: 'p3', discountPercent: 15, staggeredCount: 5 },
    ]);
    expect(entityDataUpdate.value.rules).toEqual([
      { _id: undefined, quantity: 1, discountPercent: 7 },
    ]);
    expect(previewPriceList).toHaveBeenCalledOnce();
  });

  it('resets only the rows at the overwritten volume break', async () => {
    const { editedProducts, rules } = setup();

    await rules.applyAndOverwriteRule({
      quantity: 5,
      discountPercent: 10,
      global: true,
    });
    await rules.overwriteContinueAction.value();

    expect(editedProducts.value).toEqual([
      { _id: '1', productId: 'p1', price: 100, staggeredCount: 1 },
      { _id: '2', productId: 'p2', discountPercent: 20, staggeredCount: 1 },
      { productId: 'p3', staggeredCount: 5 },
    ]);
  });
});
