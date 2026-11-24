/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from '#shared/types';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { bulkLink: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));

import AssetLinkOrderDialog from '../AssetLinkOrderDialog.vue';

const order = (id: string): Order => ({
  _id: id,
  _type: 'geins.order',
  dateCreated: '2026-11-20T10:00:00.000Z',
  customerId: 'buyer@acme.test',
  email: 'buyer@acme.test',
  sumExVat: 1600,
  sumIncVat: 2000,
  wholesaleAccountId: '7',
  channel: '1',
  currency: 'SEK',
  itemCount: 1,
  status: 'pending',
  priceLists: [],
});

// DialogContent teleports to document.body; render it inline so the wrapper
// can reach it. The lookup is stubbed to a button that lists three orders.
const stubs = {
  DialogContent: { template: '<div><slot /></div>' },
  OrderLookup: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup: () => ({ picked: ['1001', '1002', '1003'].map(order) }),
    template:
      '<button data-test="pick" @click="$emit(\'update:modelValue\', picked)" />',
  },
};

async function mountDialog() {
  const dialog = await mountWithContext(AssetLinkOrderDialog, {
    props: { open: true, assetId: 'a1', linkedOrderIds: ['1002'] },
    global: { stubs },
  });
  await dialog.find('[data-test="pick"]').trigger('click');
  return dialog;
}

const confirm = '[data-test="link-order-confirm"]';

describe('AssetLinkOrderDialog', () => {
  beforeEach(() => {
    assetApi.bulkLink.mockReset().mockResolvedValue(undefined);
  });

  it('links only the orders the asset is not linked to yet', async () => {
    const dialog = await mountDialog();

    await dialog.find(confirm).trigger('click');

    expect(assetApi.bulkLink).toHaveBeenCalledTimes(1);
    expect(assetApi.bulkLink).toHaveBeenCalledWith(
      ['a1'],
      [
        { targetType: 'orderfile', targetId: '1001' },
        { targetType: 'orderfile', targetId: '1003' },
      ],
    );
    expect(dialog.emitted('linked')).toHaveLength(1);
    expect(dialog.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('stays open and still refetches when the call fails', async () => {
    assetApi.bulkLink.mockRejectedValueOnce(new Error('offline'));
    const dialog = await mountDialog();

    await dialog.find(confirm).trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(dialog.emitted('linked')).toHaveLength(1);
    expect(dialog.emitted('update:open')).toBeUndefined();
  });
});
