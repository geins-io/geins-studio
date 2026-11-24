/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { AssetLink, Order } from '#shared/types';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi, orderApi } = vi.hoisted(() => ({
  assetApi: { links: vi.fn(), removeLink: vi.fn() },
  orderApi: { query: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi, orderApi }));
mockNuxtImport('useProductMatch', () => () => ({
  pending: ref(false),
  matchOf: () => null,
  matchById: () => null,
}));

import AssetUsedIn from '../AssetUsedIn.vue';

const link = (
  assetId: string,
  targetId: string,
  targetType = 'productimage',
): AssetLink => ({
  assetId,
  targetType,
  targetId,
  createdAt: '2026-10-01T00:00:00.000Z',
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

const stubs = {
  AssetLinkProductsDialog: true,
  AssetLinkOrderDialog: true,
  DialogDelete: true,
};

let mounted: { unmount: () => void }[] = [];
async function mountUsedIn(assetId = ref('a1'), assetPrivate = false) {
  const Host = defineComponent({
    setup: () => () =>
      h(AssetUsedIn, {
        assetId: assetId.value,
        assetType: 'image',
        assetPrivate,
      }),
  });
  const wrapper = await mountWithContext(Host, { global: { stubs } });
  mounted.push(wrapper);
  return wrapper;
}
type Wrapper = Awaited<ReturnType<typeof mountUsedIn>>;
const skeletons = (wrapper: Wrapper) =>
  wrapper.findAll('[data-slot="skeleton"]');
const rowsSection = (wrapper: Wrapper) =>
  wrapper.find('[data-test="used-in-products"]');

beforeEach(() => {
  assetApi.links.mockReset();
  assetApi.removeLink.mockReset();
  orderApi.query.mockReset();
});
afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount();
  mounted = [];
  clearNuxtData('asset-links');
});

describe('AssetUsedIn — loading', () => {
  it('shows skeletons until the first rows land', async () => {
    const first = deferred<AssetLink[]>();
    assetApi.links.mockReturnValue(first.promise);
    const wrapper = await mountUsedIn();
    expect(skeletons(wrapper)).toHaveLength(2);

    first.resolve([link('a1', 'P-100')]);
    await flush();
    expect(skeletons(wrapper)).toHaveLength(0);
    expect(rowsSection(wrapper).text()).toContain('P-100');
  });

  it('keeps the rows, busy, while the same asset refreshes', async () => {
    assetApi.links.mockResolvedValue([link('a1', 'P-100')]);
    const wrapper = await mountUsedIn();
    await flush();

    const next = deferred<AssetLink[]>();
    assetApi.links.mockReturnValue(next.promise);
    void refreshNuxtData('asset-links');
    await flush();
    expect(skeletons(wrapper)).toHaveLength(0);
    expect(rowsSection(wrapper).text()).toContain('P-100');
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);

    next.resolve([link('a1', 'P-100'), link('a1', 'P-200')]);
    await flush();
    expect(rowsSection(wrapper).text()).toContain('P-200');
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false);
  });

  it("shows skeletons, not the last asset's rows, while switching assets", async () => {
    const assetId = ref('a1');
    assetApi.links.mockResolvedValue([link('a1', 'P-100')]);
    const wrapper = await mountUsedIn(assetId);
    await flush();

    const next = deferred<AssetLink[]>();
    assetApi.links.mockReturnValue(next.promise);
    assetId.value = 'a2';
    await flush();
    expect(skeletons(wrapper)).toHaveLength(2);
    expect(wrapper.text()).not.toContain('P-100');

    next.resolve([link('a2', 'P-300')]);
    await flush();
    expect(skeletons(wrapper)).toHaveLength(0);
    expect(rowsSection(wrapper).text()).toContain('P-300');
  });
});

const ordersSection = (wrapper: Wrapper) =>
  wrapper.find('[data-test="used-in-orders"]');

describe('AssetUsedIn — orders', () => {
  const order: Order = {
    _id: '1001',
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
  };

  it('lists order links with the looked-up order details', async () => {
    assetApi.links.mockResolvedValue([link('a1', '1001', 'orderfile')]);
    orderApi.query.mockResolvedValue({ items: [order] });
    const wrapper = await mountUsedIn();
    await flush();

    expect(orderApi.query).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [{ selections: [{ orderIds: ['1001'] }] }],
      }),
      undefined,
      { suppressErrorToast: true },
    );
    expect(ordersSection(wrapper).findAll('li')).toHaveLength(1);
    expect(ordersSection(wrapper).text()).toContain('buyer@acme.test');
    expect(rowsSection(wrapper).findAll('li')).toHaveLength(0);
  });

  it('still shows the order number when the order read fails', async () => {
    assetApi.links.mockResolvedValue([link('a1', '1001', 'orderfile')]);
    orderApi.query.mockRejectedValue(new Error('offline'));
    const wrapper = await mountUsedIn();
    await flush();

    // The row stays (with only the order number), so the link isn't hidden.
    expect(ordersSection(wrapper).findAll('li')).toHaveLength(1);
    expect(ordersSection(wrapper).text()).not.toContain('buyer@acme.test');
  });

  it('disables Link to product on a private asset', async () => {
    assetApi.links.mockResolvedValue([]);
    const wrapper = await mountUsedIn(ref('a1'), true);
    await flush();

    const button = wrapper.find('[data-test="used-in-link-product"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(
      wrapper.find('[data-test="used-in-link-order"]').attributes('disabled'),
    ).toBeUndefined();
  });
});
