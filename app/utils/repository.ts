import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Account, Channel, Product } from '#shared/types';

const ENDPOINTS = {
  PRODUCTS: '/products',
  ACCOUNT: '/account',
  CHANNELS: '/account/channel/list',
  CURRENCY: '/account/currency/list',
  LANGUAGE: '/account/language/list',
};

export const repository = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
  product: {
    async list(): Promise<Product> {
      return await fetch(ENDPOINTS.PRODUCTS);
    },
  },
  account: {
    async get(): Promise<Account> {
      return await fetch(ENDPOINTS.ACCOUNT);
    },
  },
  channel: {
    async list(): Promise<Channel[]> {
      return await fetch(ENDPOINTS.CHANNELS);
    },
  },
  currency: {
    async list(): Promise<Currency[]> {
      return await fetch(ENDPOINTS.CURRENCY);
    },
  },
  language: {
    async list(): Promise<Language[]> {
      return await fetch(ENDPOINTS.LANGUAGE);
    },
  },
});
