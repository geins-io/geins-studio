/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { computed, nextTick, ref } from 'vue';

const { accountStore, productsStore } = vi.hoisted(() => ({
  accountStore: { init: vi.fn(), reset: vi.fn() },
  productsStore: { reset: vi.fn() },
}));

const status = ref<'loading' | 'authenticated' | 'unauthenticated'>(
  'unauthenticated',
);
const isAuthenticated = computed(() => status.value === 'authenticated');

mockNuxtImport('useAuth', () => () => ({ status }));
mockNuxtImport('useGeinsAuth', () => () => ({ isAuthenticated }));
mockNuxtImport('useAccountStore', () => () => accountStore);
mockNuxtImport('useProductsStore', () => () => productsStore);

import geinsGlobal from '../geins-global';

async function setStatus(value: typeof status.value) {
  status.value = value;
  await nextTick();
}

describe('geins-global plugin', () => {
  // Registered once: each call adds another auth watcher.
  beforeAll(async () => {
    await geinsGlobal(useNuxtApp());
  });

  beforeEach(async () => {
    await setStatus('authenticated');
    vi.clearAllMocks();
  });

  it('does not reset the stores on a token refresh', async () => {
    await setStatus('loading');
    await setStatus('authenticated');

    expect(productsStore.reset).not.toHaveBeenCalled();
    expect(accountStore.reset).not.toHaveBeenCalled();
    expect(accountStore.init).not.toHaveBeenCalled();
  });

  it('resets the stores on logout', async () => {
    await setStatus('loading');
    await setStatus('unauthenticated');

    expect(productsStore.reset).toHaveBeenCalledTimes(1);
    expect(accountStore.reset).toHaveBeenCalledTimes(1);
  });
});
