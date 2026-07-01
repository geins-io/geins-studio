/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';

const { replace, routeRef } = vi.hoisted(() => ({
  replace: vi.fn(() => Promise.resolve()),
  routeRef: {
    query: {} as Record<string, string | string[]>,
    params: {},
    meta: {},
    path: '/',
    fullPath: '/',
    hash: '',
    name: undefined,
    matched: [],
  },
}));

mockNuxtImport('useRoute', () => () => routeRef);

// Stub only `replace`; the no-op methods keep Nuxt's client plugins (which
// register afterEach/beforeResolve on the router) from crashing on the mock.
mockNuxtImport('useRouter', () => {
  const noop = () => () => {};
  return () => ({
    replace,
    push: () => Promise.resolve(),
    afterEach: noop,
    beforeEach: noop,
    beforeResolve: noop,
    onError: () => {},
    isReady: () => Promise.resolve(),
    resolve: () => ({}),
    currentRoute: {
      value: { fullPath: '/', query: routeRef.query, matched: [], meta: {} },
    },
    options: {},
  });
});

import ContentEditTabs from './ContentEditTabs.vue';

const tabs = ['general', 'buyers', 'price lists', 'orders'];

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  replace.mockReset();
  routeRef.query = {};
});

describe('ContentEditTabs', () => {
  // A redundant tab navigation clears an active fatal error (Nuxt router
  // afterEach), causing an infinite refetch loop — the watcher must skip it.
  it('does not navigate when the initial ?tab= already matches the active tab', async () => {
    routeRef.query = { tab: '3' };

    await mountWithContext(ContentEditTabs, {
      props: { tabs, currentTab: 0 },
    });
    await flush();

    // The component navigates with an object `{ query }`; Nuxt's internal
    // `replace('/')` calls are strings, so assert only on object-shaped calls.
    expect(replace).not.toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.anything() }),
    );
  });

  it('navigates when the active tab changes to a new value', async () => {
    const wrapper = await mountWithContext(ContentEditTabs, {
      props: { tabs, currentTab: 0 },
    });
    await flush();
    replace.mockReset();

    const thirdTab = wrapper.findAll('button')[2];
    expect(thirdTab).toBeDefined();
    await thirdTab?.trigger('click');
    await flush();

    expect(replace).toHaveBeenCalledWith({ query: { tab: '2' } });
  });

  it('removes the tab param when returning to the first tab', async () => {
    routeRef.query = { tab: '2' };

    const wrapper = await mountWithContext(ContentEditTabs, {
      props: { tabs, currentTab: 0 },
    });
    await flush();
    replace.mockReset();

    const firstTab = wrapper.findAll('button')[0];
    expect(firstTab).toBeDefined();
    await firstTab?.trigger('click');
    await flush();

    expect(replace).toHaveBeenCalledWith({ query: {} });
  });
});
