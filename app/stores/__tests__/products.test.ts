/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { productApi } = vi.hoisted(() => ({
  productApi: {
    list: vi.fn(),
    category: { list: vi.fn() },
    brand: { list: vi.fn() },
  },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ productApi }));

import { useProductsStore } from '../products';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('products store init', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    productApi.list.mockReset().mockResolvedValue({ items: [] });
    productApi.category.list.mockReset().mockResolvedValue({ items: [] });
    productApi.brand.list.mockReset().mockResolvedValue({ items: [] });
  });

  it('shares one load between concurrent init() calls', async () => {
    const store = useProductsStore();
    await Promise.all([store.init(), store.init(), store.init()]);
    expect(productApi.list).toHaveBeenCalledTimes(1);
    expect(store.initialized).toBe(true);

    await store.init();
    expect(productApi.list).toHaveBeenCalledTimes(1);
  });

  it('drops a load that a reset() overtook', async () => {
    const store = useProductsStore();
    const pending = deferred<{ items: unknown[] }>();
    productApi.list.mockReturnValueOnce(pending.promise);

    const first = store.init();
    store.reset();
    pending.resolve({ items: [{ _id: 'old', name: 'Old account' }] });
    await first;

    expect(store.products).toEqual([]);
    expect(store.initialized).toBe(false);

    // The next account's init() loads fresh rather than skipping.
    await store.init();
    expect(productApi.list).toHaveBeenCalledTimes(2);
    expect(store.initialized).toBe(true);
  });
});
