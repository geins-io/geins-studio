import { vi } from 'vitest';

/**
 * Creates a fully mocked `useGeinsRepository()` return value.
 *
 * Every method is a `vi.fn()` stub. Each call returns independent instances
 * (no shared state between calls).
 *
 * Usage:
 * ```ts
 * const { useGeinsRepository, channelApi } = vi.hoisted(() => createMockRepository());
 * vi.mock('#app/composables/useGeinsRepository', () => ({ useGeinsRepository }));
 *
 * channelApi.channel.get.mockResolvedValue(buildChannel());
 * ```
 */
export function createMockRepository() {
  const accountApi = {
    account: { get: vi.fn() },
    channel: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
      id: vi.fn((_channelId: string) => ({
        market: { list: vi.fn() },
        payment: { list: vi.fn(), get: vi.fn() },
        mail: {
          getTexts: vi.fn(),
          updateTexts: vi.fn(),
          preview: vi.fn(),
        },
        resetStorefrontSchema: vi.fn(),
      })),
    },
    currency: { list: vi.fn() },
    language: { list: vi.fn(), get: vi.fn() },
    market: { list: vi.fn() },
    payment: { list: vi.fn() },
  };

  const orderApi = {
    get: vi.fn(),
    query: vi.fn(),
    quotation: {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const customerApi = {
    company: {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    buyer: { get: vi.fn(), list: vi.fn() },
    customer: {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const productApi = {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    priceList: {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const globalApi = {
    account: { get: vi.fn() },
    channel: { list: vi.fn() },
    currency: { list: vi.fn() },
    language: { list: vi.fn() },
  };

  const useGeinsRepository = vi.fn(() => ({
    accountApi,
    orderApi,
    customerApi,
    productApi,
    globalApi,
  }));

  return {
    useGeinsRepository,
    accountApi,
    orderApi,
    customerApi,
    productApi,
    globalApi,
  };
}
