/* eslint-disable import/order, import/first */
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { computed, ref, toValue } from 'vue';
import type {
  ProductPriceList,
  ProductPriceListApiOptions,
  ProductPriceListCreate,
} from '#shared/types';
import type { UsePriceListEditorOptions } from '@/composables/pricing/usePriceListEditor';
import { useAccountStore } from '@/stores/account';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  editorOptions: undefined as UsePriceListEditorOptions | undefined,
}));

mockNuxtImport('useGeinsRepository', () => () => ({
  productApi: { priceList: { get: mocks.get } },
}));
mockNuxtImport(
  'usePriceListEditor',
  () => (options: UsePriceListEditorOptions) => {
    mocks.editorOptions = options;
    return {
      content: computed(() => ({})),
      isDirty: computed(() => false),
      saving: ref(false),
      seed: vi.fn(),
      load: vi.fn(),
      afterSave: vi.fn(),
      captureBaseline: vi.fn(),
    };
  },
);

import CompanyPriceListEditor from '../CompanyPriceListEditor.vue';

const stubs = { PriceListEditor: true };

const seed: ProductPriceListCreate = {
  name: 'Acme AB SEK',
  identifier: 'ACME-SEK',
  channel: '1',
  currency: 'SEK',
  dateCreated: '',
  exVat: true,
  active: true,
  forced: true,
  autoAddProducts: false,
  wholesaleAccountId: 'c1',
};

const listOf = (fields: Partial<ProductPriceList>): ProductPriceList => ({
  _id: '20',
  _type: 'price_list',
  name: 'Industrikund AB',
  identifier: 'MONC-1',
  channel: '1',
  currency: 'EUR',
  dateCreated: '',
  exVat: true,
  active: true,
  forced: true,
  autoAddProducts: false,
  readOnly: false,
  accountSpecific: true,
  wholesaleAccountId: 'c1',
  productCount: 4,
  rules: [],
  ...fields,
});

// The content load asks for rules and the selection, the header for counts.
const respond = (counts: Partial<ProductPriceList> = {}) =>
  mocks.get.mockImplementation(
    async (id: string, options?: ProductPriceListApiOptions) =>
      options?.fields?.includes('counts')
        ? { _id: id, ...counts }
        : { _id: id, rules: [], productSelectionQuery: undefined },
  );

let mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.forEach((m) => m.unmount());
  mounted = [];
  mocks.get.mockReset();
  mocks.editorOptions = undefined;
});

beforeEach(() => {
  useAccountStore().$patch({ channels: [{ _id: '1', name: 'Sweden' }] });
});

async function mountEditor(listKey: string, priceList?: ProductPriceList) {
  const editor = await mountSuspended(CompanyPriceListEditor, {
    props: { listKey, priceList, seed },
    global: { stubs },
  });
  mounted.push(editor);
  await flushPromises();
  return editor;
}

const has = (editor: Awaited<ReturnType<typeof mountEditor>>, test: string) =>
  editor.find(`[data-test="${test}"]`).exists();

describe('CompanyPriceListEditor — header', () => {
  it('names a saved list with its channel and currency', async () => {
    respond();
    const editor = await mountEditor('20', listOf({}));
    expect(editor.find('h2').text()).toBe('Industrikund AB');
    expect(editor.text()).toContain('Sweden · EUR');
  });

  it('names a draft from its seed', async () => {
    respond();
    const editor = await mountEditor('draft-a');
    expect(editor.find('h2').text()).toBe('Acme AB SEK');
    expect(editor.text()).toContain('Sweden · SEK');
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('shows the counts once they load', async () => {
    respond({ manualPriceProductCount: 3, volumePriceProductCount: 1 });
    const editor = await mountEditor('21', listOf({ _id: '21' }));
    expect(mocks.get).toHaveBeenCalledWith(
      '21',
      { fields: ['counts'] },
      { suppressErrorToast: true },
    );
    expect(has(editor, 'price-list-counts')).toBe(true);
  });

  it('leaves the counts out while the API has none', async () => {
    respond();
    const editor = await mountEditor('22', listOf({ _id: '22' }));
    expect(has(editor, 'price-list-counts')).toBe(false);
  });

  it('refreshes the counts after a draft is first saved', async () => {
    respond({ manualPriceProductCount: 2, volumePriceProductCount: 0 });
    const editor = await mountEditor('draft-b');
    expect(has(editor, 'price-list-counts')).toBe(false);

    await editor.vm.afterSave(listOf({ _id: '30' }));
    await flushPromises();
    expect(mocks.get).toHaveBeenCalledWith(
      '30',
      { fields: ['counts'] },
      { suppressErrorToast: true },
    );
    expect(has(editor, 'price-list-counts')).toBe(true);
  });
});

describe('CompanyPriceListEditor — read-only lists', () => {
  it('keeps a Studio-managed list editable', async () => {
    respond();
    const editor = await mountEditor('40', listOf({ _id: '40' }));
    expect(toValue(mocks.editorOptions?.readOnly)).toBe(false);
    expect(has(editor, 'price-list-lock')).toBe(false);
  });

  it('opens an ERP list read-only with the lock', async () => {
    respond();
    const editor = await mountEditor(
      '41',
      listOf({ _id: '41', readOnly: true }),
    );
    expect(toValue(mocks.editorOptions?.readOnly)).toBe(true);
    expect(has(editor, 'price-list-lock')).toBe(true);
    expect(has(editor, 'price-list-inactive')).toBe(false);
  });

  it('says when an ERP list is inactive', async () => {
    respond();
    const editor = await mountEditor(
      '42',
      listOf({ _id: '42', readOnly: true, active: false }),
    );
    expect(has(editor, 'price-list-inactive')).toBe(true);
  });
});
