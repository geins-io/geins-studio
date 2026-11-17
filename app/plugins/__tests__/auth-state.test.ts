/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from 'vitest';
import { computed, nextTick, ref } from 'vue';
import type { Session } from '#shared/types';

const { auth } = vi.hoisted(() => ({
  auth: {
    refresh: vi.fn(),
    syncSession: vi.fn(),
    expiresSoon: vi.fn(() => true),
  },
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
  refresh: auth.refresh,
  syncSession: auth.syncSession,
  isExpired: () => false,
  expiresSoon: auth.expiresSoon,
  logout: async () => {},
}));

import authState from '../auth-state';

const signedIn: Session = {
  isAuthenticated: true,
  accountKey: 'account-1',
  tokenExpires: 1000,
};

describe('auth-state plugin', () => {
  const warnings: string[] = [];

  // Run once, as at boot: signed out until the session read signs in. Each
  // run adds another poll and listener.
  beforeAll(async () => {
    session.value = null;
    await nextTick();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    auth.syncSession.mockImplementation(async () => {
      session.value = signedIn;
      return session.value;
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation((...args) => {
      warnings.push(args.map(String).join(' '));
    });
    const nuxtApp = useNuxtApp();
    await nuxtApp.runWithContext(() => authState(nuxtApp));
    warn.mockRestore();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    session.value = signedIn;
    auth.expiresSoon.mockReturnValue(true);
    await nextTick();
    vi.clearAllMocks();
  });

  // The poll's cleanup needs the app's effect scope, which ends at the
  // plugin's first await.
  it('sets up the refresh poll without an effect scope warning', () => {
    expect(warnings.filter((w) => w.includes('onScopeDispose'))).toEqual([]);
  });

  // Not counted: the poll the app's boot registered starts on that sign-in too.
  it('polls once the session read has signed in, and refreshes a due token', async () => {
    await vi.advanceTimersByTimeAsync(60_000);
    expect(auth.refresh).toHaveBeenCalled();
  });

  it("doesn't refresh on the poll before the token is due", async () => {
    auth.expiresSoon.mockReturnValue(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  // Not counted: the app's boot registered a listener too.
  it('refreshes a due token when the tab becomes visible', () => {
    document.dispatchEvent(new Event('visibilitychange'));
    expect(auth.refresh).toHaveBeenCalled();
  });

  it('neither polls nor refreshes on visibility while signed out', async () => {
    session.value = null;
    await nextTick();
    await vi.advanceTimersByTimeAsync(60_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});
