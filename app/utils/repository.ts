import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Account, Channel, Product } from '#shared/types';

const ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  ACCOUNT: '/account',
  CHANNELS: '/account/channel/list',
  CURRENCY: '/account/currency/list',
  LANGUAGE: '/account/language/list',
};

export const repository = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
  product: {
    async list(): Promise<Product[]> {
      return await fetch<Product[]>(ENDPOINTS.PRODUCTS);
    },
  },
  category: {
    async list(): Promise<Category[]> {
      return await fetch<Category[]>(ENDPOINTS.CATEGORIES);
    },
  },
  brand: {
    async list(): Promise<Brand[]> {
      return await fetch<Brand[]>(ENDPOINTS.BRANDS);
    },
  },
  account: {
    async get(): Promise<Account> {
      return await fetch<Account>(ENDPOINTS.ACCOUNT);
    },
  },
  channel: {
    async list(): Promise<Channel[]> {
      return await fetch<Channel[]>(ENDPOINTS.CHANNELS);
    },
  },
  currency: {
    async list(): Promise<Currency[]> {
      return await fetch<Currency[]>(ENDPOINTS.CURRENCY);
    },
  },
  language: {
    async list(): Promise<Language[]> {
      return await fetch<Language[]>(ENDPOINTS.LANGUAGE);
    },
  },
});
