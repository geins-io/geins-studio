/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { bulkLink: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));

import AssetLinkProductsDialog from '../AssetLinkProductsDialog.vue';

// DialogContent teleports to document.body; render it inline so the wrapper
// can reach it. The picker is stubbed to a button that picks one product.
const stubs = {
  DialogContent: { template: '<div><slot /></div>' },
  ProductMultiSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button data-test="pick" @click="$emit(\'update:modelValue\', [\'p1\'])" />',
  },
};

const linked = { productimage: [], productfile: [] };

async function mountDialog(assetType: string) {
  return await mountWithContext(AssetLinkProductsDialog, {
    props: {
      open: true,
      assetId: 'a1',
      assetType,
      linkedProductIds: linked,
    },
    global: { stubs },
  });
}

describe('AssetLinkProductsDialog', () => {
  beforeEach(() => {
    assetApi.bulkLink.mockReset().mockResolvedValue(undefined);
  });

  it('offers Image and File for an image, defaulting to Image', async () => {
    const dialog = await mountDialog('image');
    const pressed = dialog.findAll('[aria-pressed]');
    expect(pressed).toHaveLength(2);
    expect(pressed[0]!.attributes('aria-pressed')).toBe('true');

    await dialog.find('[data-test="pick"]').trigger('click');
    await dialog.find('[data-test="link-products-confirm"]').trigger('click');
    expect(assetApi.bulkLink).toHaveBeenCalledWith(
      ['a1'],
      [{ targetType: 'productimage', targetId: 'p1' }],
    );
  });

  it('links a non-image as File, with no choice shown', async () => {
    const dialog = await mountDialog('pdf');
    expect(dialog.findAll('[aria-pressed]')).toHaveLength(0);

    await dialog.find('[data-test="pick"]').trigger('click');
    await dialog.find('[data-test="link-products-confirm"]').trigger('click');
    expect(assetApi.bulkLink).toHaveBeenCalledWith(
      ['a1'],
      [{ targetType: 'productfile', targetId: 'p1' }],
    );
  });
});
