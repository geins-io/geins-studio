/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

const { me, logout } = vi.hoisted(() => ({
  me: { get: vi.fn() },
  logout: vi.fn(),
}));

mockNuxtImport('useGeinsRepository', () => () => ({ userApi: { me } }));
mockNuxtImport('useGeinsAuth', () => () => ({
  session: ref({ isAuthenticated: true, accountKey: 'account-1' }),
  // For the app's own auth-state plugin, which boots with this mock.
  authStateDiffers: ref(false),
  logout,
}));

import { useUserStore } from '../user';

const user = {
  _id: 'ada@example.com',
  _type: 'user',
  name: 'Ada Lovelace',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
};

describe('user store init', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    me.get.mockReset();
    logout.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a user/me 5xx in the background, keeps the session, and never shows N/A', async () => {
    me.get
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 0 })
      .mockResolvedValue(user);
    const store = useUserStore();

    // Boot awaits the first attempt only.
    await store.init();
    expect(store.user).toBeUndefined();
    expect(store.userInitials).toBe('');
    expect(store.userEmail).toBe('');

    await vi.advanceTimersByTimeAsync(1_000);
    expect(me.get).toHaveBeenCalledTimes(2);
    expect(store.user).toBeUndefined();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(me.get).toHaveBeenCalledTimes(3);
    expect(store.userInitials).toBe('AL');
    expect(store.userEmail).toBe('ada@example.com');
    expect(logout).not.toHaveBeenCalled();
  });

  it('stops retrying after a few attempts', async () => {
    me.get.mockRejectedValue({ status: 500 });
    const store = useUserStore();

    await store.init();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(me.get).toHaveBeenCalledTimes(5);
    expect(store.userEmail).toBe('');
  });

  it('starts a fresh round of retries on a later init', async () => {
    me.get.mockRejectedValue({ status: 503 });
    const store = useUserStore();

    await store.init();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(me.get).toHaveBeenCalledTimes(5);

    me.get.mockRejectedValueOnce({ status: 503 }).mockResolvedValue(user);
    await store.init();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(me.get).toHaveBeenCalledTimes(7);
    expect(store.userEmail).toBe('ada@example.com');
  });

  it('leaves a 401 to the request flow', async () => {
    me.get.mockRejectedValue({ status: 401 });
    const store = useUserStore();

    await store.init();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(me.get).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending retry on reset', async () => {
    me.get.mockRejectedValueOnce({ status: 503 }).mockResolvedValue(user);
    const store = useUserStore();

    await store.init();
    store.reset();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(me.get).toHaveBeenCalledTimes(1);
    expect(store.user).toBeUndefined();
  });

  it('shows no N/A for a user without a name or email', async () => {
    me.get.mockResolvedValue({
      ...user,
      firstName: '',
      lastName: '',
      email: null,
    });
    const store = useUserStore();

    await store.init();

    expect(store.userInitials).toBe('');
  });
});
