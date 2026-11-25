// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { computed, ref } from 'vue';

const auth = vi.hoisted(() => ({
  user: null as null | { value: { _id: string } | undefined },
  accountKey: null as null | { value: string | undefined },
  warn: null as null | ReturnType<typeof vi.fn>,
}));

mockNuxtImport('useUserStore', () => () => ({ user: auth.user }));
mockNuxtImport('storeToRefs', () => (store: unknown) => store);
mockNuxtImport('useGeinsAuth', () => () => ({
  accountKey: computed(() => auth.accountKey!.value),
}));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogWarn: auth.warn }));

import { defaultDashboardBoard, serializeDashboards } from '@/lib/dashboard';
import { useDashboardStorage } from '../dashboard/useDashboardStorage';

const KEY = 'geins-dashboard-acme-u1';

let store: Map<string, string>;
const localStorageStub = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
};

beforeEach(() => {
  store = new Map();
  auth.user = ref({ _id: 'u1' });
  auth.accountKey = ref('acme');
  auth.warn = vi.fn();
  localStorageStub.getItem.mockImplementation(
    (key: string) => store.get(key) ?? null,
  );
  localStorageStub.setItem.mockImplementation(
    (key: string, value: string) => void store.set(key, value),
  );
  vi.stubGlobal('localStorage', localStorageStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDashboardStorage', () => {
  it('keys by account and user, and waits until both are known', () => {
    expect(useDashboardStorage().storageKey.value).toBe(KEY);

    auth.accountKey!.value = undefined;
    const { storageKey, load, save } = useDashboardStorage();
    expect(storageKey.value).toBeNull();
    expect(load()).toBeNull();
    save(defaultDashboardBoard());
    expect(localStorageStub.setItem).not.toHaveBeenCalled();
  });

  it('saves and loads a board', () => {
    const board = defaultDashboardBoard();
    const { load, save } = useDashboardStorage();
    save(board);
    expect(JSON.parse(store.get(KEY)!)).toEqual(serializeDashboards(board));
    expect(load()).toEqual(board);
  });

  it('gives null for nothing saved, bad JSON or an unreadable board', () => {
    const { load } = useDashboardStorage();
    expect(load()).toBeNull();

    store.set(KEY, '{not json');
    expect(load()).toBeNull();

    store.set(KEY, JSON.stringify({ version: 99, dashboards: [] }));
    expect(load()).toBeNull();
    expect(auth.warn).toHaveBeenCalledTimes(2);
  });

  it('never throws when storage is blocked or full', () => {
    localStorageStub.getItem.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    localStorageStub.setItem.mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const { load, save } = useDashboardStorage();

    expect(load()).toBeNull();
    expect(() => save(defaultDashboardBoard())).not.toThrow();
    expect(auth.warn).toHaveBeenCalledTimes(2);
  });
});
