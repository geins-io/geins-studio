/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import type { Session } from '#shared/types';

const { accountStore, productsStore, userStore } = vi.hoisted(() => ({
  accountStore: { init: vi.fn(), reset: vi.fn() },
  productsStore: { reset: vi.fn() },
  userStore: { init: vi.fn(), reset: vi.fn() },
}));

const session = ref<Session | null>(null);
const isAuthenticated = computed(
  () => !!session.value?.isAuthenticated && !!session.value?.accountKey,
);

// Complete enough for the app's own plugins, which boot with this mock too.
mockNuxtImport('useGeinsAuth', () => () => ({
  session,
  isAuthenticated,
  sessionError: computed(() => undefined),
  authStateDiffers: computed(() => false),
  accountKey: computed(() => session.value?.accountKey),
  authSignal: ref(undefined),
  refresh: async () => session.value,
  syncSession: async () => session.value,
  isExpired: () => false,
  expiresSoon: () => false,
  logout: async () => {},
}));
mockNuxtImport('useAccountStore', () => () => accountStore);
mockNuxtImport('useProductsStore', () => () => productsStore);
mockNuxtImport('useUserStore', () => () => userStore);

import geinsGlobal from '../geins-global';

const signedIn = (tokenExpires: number): Session => ({
  isAuthenticated: true,
  accountKey: 'account-1',
  tokenExpires,
});

async function setSession(value: Session | null) {
  session.value = value;
  await nextTick();
}

describe('geins-global plugin', () => {
  // Registered once: each call adds another auth watcher.
  beforeAll(async () => {
    await geinsGlobal(useNuxtApp());
  });

  beforeEach(async () => {
    await setSession(signedIn(1000));
    vi.clearAllMocks();
  });

  it('does not reset the stores on a token refresh', async () => {
    await setSession(signedIn(2000));

    expect(productsStore.reset).not.toHaveBeenCalled();
    expect(accountStore.reset).not.toHaveBeenCalled();
    expect(accountStore.init).not.toHaveBeenCalled();
    expect(userStore.reset).not.toHaveBeenCalled();
    expect(userStore.init).not.toHaveBeenCalled();
  });

  // Not counted: the app's boot registers this plugin's watcher too.
  it('resets the stores on logout', async () => {
    await setSession({ isAuthenticated: false });

    expect(productsStore.reset).toHaveBeenCalled();
    expect(accountStore.reset).toHaveBeenCalled();
    expect(userStore.reset).toHaveBeenCalled();
  });
});
