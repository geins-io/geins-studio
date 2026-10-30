// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import type {
  ProductPriceListUpdate,
  SelectorSelectionQueryBase,
} from '#shared/types';

const {
  previewPriceList,
  loadReadOnlyRows,
  setupPriceListColumns,
  setupReadOnlyPriceListColumns,
} = vi.hoisted(() => ({
  previewPriceList: vi.fn(() => Promise.resolve()),
  loadReadOnlyRows: vi.fn(() => Promise.resolve()),
  setupPriceListColumns: vi.fn(() => []),
  setupReadOnlyPriceListColumns: vi.fn(() => []),
}));

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useGeinsRepository', () => () => ({ productApi: {} }));
mockNuxtImport('useProductsStore', () => () => ({ init: vi.fn() }));
mockNuxtImport('useSelector', () => () => ({
  getEmptyQuerySelectionBase: () => ({}),
}));
// Plain objects: the product repo calls this while modules load, before `ref` exists.
mockNuxtImport('useBatchQuery', () => () => ({
  batchQueryMatchAll: { value: {} },
  batchQueryNoPagination: { value: {} },
}));
mockNuxtImport('useAsyncData', () => () => ({
  data: ref([]),
  error: ref(null),
  status: ref('idle'),
  execute: loadReadOnlyRows,
}));
mockNuxtImport('usePriceListProducts', () => () => ({
  transformProductsForList: (rows: unknown[]) => rows,
  getPriceListProduct: vi.fn(),
  addToPriceListProducts: vi.fn(),
  convertPriceModeToRuleField: vi.fn(),
}));
mockNuxtImport('usePriceListProductsTable', () => () => ({
  setupPriceListColumns,
  setupReadOnlyPriceListColumns,
  getPinnedState: ref({ left: [], right: [] }),
}));
mockNuxtImport('usePriceListPreview', () => () => ({
  selectedProducts: ref([]),
  hasProductSelection: computed(() => false),
  previewPriceList,
}));
mockNuxtImport('usePriceListRules', () => () => ({ globalRules: ref([]) }));
mockNuxtImport('usePriceListVolumePricing', () => () => ({
  actualPriceListRulesMode: ref('discount'),
}));
mockNuxtImport('usePanelDirty', () => () => ({
  isDirty: computed(() => false),
  captureBaseline: vi.fn(),
}));

import { usePriceListEditor } from '../pricing/usePriceListEditor';

const selection: SelectorSelectionQueryBase = { include: [] };

function setup(draftValues: ProductPriceListUpdate = {}) {
  const readOnly = ref(true);
  const draft = ref<ProductPriceListUpdate>(draftValues);
  const editor = usePriceListEditor({ priceListId: '7', draft, readOnly });
  return { editor, readOnly };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePriceListEditor read-only override', () => {
  it('loads a read-only list from its saved rows, without a preview', async () => {
    const { editor } = setup({ productSelectionQuery: selection });
    await editor.load();
    expect(loadReadOnlyRows).toHaveBeenCalledOnce();
    expect(previewPriceList).not.toHaveBeenCalled();
  });

  it('loads again as editable when readOnly turns off after load()', async () => {
    const { editor, readOnly } = setup({ productSelectionQuery: selection });
    await editor.load();

    readOnly.value = false;
    await nextTick();

    expect(setupPriceListColumns).toHaveBeenCalled();
    expect(previewPriceList).toHaveBeenCalledOnce();
    expect(previewPriceList).toHaveBeenCalledWith(undefined, true, false);
  });

  it('keeps the saved rows, now editable, for a list without a selection', async () => {
    const { editor, readOnly } = setup();
    await editor.load();

    readOnly.value = false;
    await nextTick();

    expect(setupPriceListColumns).toHaveBeenCalledOnce();
    expect(previewPriceList).not.toHaveBeenCalled();
  });

  it('does nothing when readOnly turns off before load()', async () => {
    const { readOnly } = setup({ productSelectionQuery: selection });

    readOnly.value = false;
    await nextTick();

    expect(setupPriceListColumns).not.toHaveBeenCalled();
    expect(previewPriceList).not.toHaveBeenCalled();
  });
});
