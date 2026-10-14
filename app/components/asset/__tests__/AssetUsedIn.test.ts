/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { AssetLink } from '#shared/types';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { links: vi.fn(), removeLink: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));
mockNuxtImport('useProductMatch', () => () => ({
  pending: ref(false),
  matchOf: () => null,
  matchById: () => null,
}));

import AssetUsedIn from '../AssetUsedIn.vue';

const link = (assetId: string, targetId: string): AssetLink => ({
  assetId,
  targetType: 'productimage',
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

const stubs = { AssetLinkProductsDialog: true, DialogDelete: true };

let mounted: { unmount: () => void }[] = [];
async function mountUsedIn(assetId = ref('a1')) {
  const Host = defineComponent({
    setup: () => () =>
      h(AssetUsedIn, { assetId: assetId.value, assetType: 'image' }),
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
