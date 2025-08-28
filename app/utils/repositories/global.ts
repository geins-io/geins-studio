import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Account, Channel } from '#shared/types';

const ENDPOINTS = {
  ACCOUNT: '/account',
  CHANNELS: '/account/channel/list',
  CURRENCY: '/account/currency/list',
  LANGUAGE: '/account/language/list',
};

export const globalRepo = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
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
