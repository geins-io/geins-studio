// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type {
  PriceListProduct,
  ProductPriceList,
  ProductPriceListUpdate,
} from '#shared/types';

const { newPreview, savedPreview, priceListId, toast } = vi.hoisted(() => {
  const savedPreview = vi.fn();
  return {
    newPreview: vi.fn(),
    savedPreview,
    priceListId: vi.fn(() => ({ preview: savedPreview })),
    toast: vi.fn(),
  };
});

mockNuxtImport('useGeinsRepository', () => () => ({
  productApi: { priceList: { preview: newPreview, id: priceListId } },
}));
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError: vi.fn() }));

vi.mock('@/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}));

import { usePriceListPreview } from '../pricing/usePriceListPreview';

const rows: PriceListProduct[] = [
  {
    _id: 'new_1',
    productId: 'p1',
    price: 90,
    priceMode: 'fixed',
    staggeredCount: 1,
  },
  {
    _id: '42',
    productId: 'p2',
    price: 80,
    priceMode: 'fixed',
    staggeredCount: 1,
  },
  {
    _id: 'new_2',
    productId: 'p3',
    price: 70,
    priceMode: 'auto',
    staggeredCount: 1,
  },
];
const response = { products: { items: rows } } as ProductPriceList;

function setup(id: string | null, priceList: ProductPriceListUpdate = {}) {
  const onUpdateProducts = vi.fn(() => Promise.resolve());
  const preview = usePriceListPreview({
    entityId: ref(id),
    entityDataUpdate: ref(priceList),
    transformProductsForList: () => [],
    setupColumns: vi.fn(),
    onUpdateProducts,
    convertPriceModeToRuleField: () => 'price',
    getPriceListProduct: (productId, value, _mode, staggeredCount) => ({
      productId,
      ...(value !== null && { price: value }),
      staggeredCount,
    }),
  });
  return { ...preview, onUpdateProducts };
}

const withSelection: ProductPriceListUpdate = {
  productSelectionQuery: { include: [], exclude: [] },
};

describe('usePriceListPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    newPreview.mockResolvedValue(response);
    savedPreview.mockResolvedValue(response);
  });

  it('previews changes on a saved list by id', async () => {
    const { previewPriceList } = setup('pl1', withSelection);
    await previewPriceList();
    expect(priceListId).toHaveBeenCalledWith('pl1');
    expect(savedPreview).toHaveBeenCalledOnce();
    expect(newPreview).not.toHaveBeenCalled();
  });

  it('previews a new list without an id', async () => {
    const { previewPriceList, priceListProducts } = setup(null, withSelection);
    await previewPriceList();
    expect(newPreview).toHaveBeenCalledWith(
      withSelection,
      expect.any(Object),
      { fields: ['products', 'productinfo'] },
      { suppressErrorToast: true },
    );
    expect(priceListId).not.toHaveBeenCalled();
    expect(priceListProducts.value).toEqual(rows);
  });

  it('skips the preview without a selection query', async () => {
    const { previewPriceList } = setup(null);
    await previewPriceList();
    expect(newPreview).not.toHaveBeenCalled();
    expect(savedPreview).not.toHaveBeenCalled();
  });

  it('never hands back the made-up preview ids', async () => {
    const { previewPriceList, onUpdateProducts } = setup(null, withSelection);
    await previewPriceList(undefined, true, false);
    expect(onUpdateProducts).toHaveBeenCalledWith([
      { productId: 'p1', price: 90, staggeredCount: 1 },
      { _id: '42', productId: 'p2', price: 80, staggeredCount: 1 },
    ]);
  });
});
