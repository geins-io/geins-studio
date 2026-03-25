import type { Account, ChannelListItem, ChannelApiOptions } from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const ENDPOINTS = {
  ACCOUNT: '/account',
  CHANNELS: '/account/channel/list',
  CURRENCY: '/account/currency/list',
  LANGUAGE: '/account/language/list',
};

/**
 * Creates repository for global account-level endpoints.
 *
 * Provides access to account details, channels, currencies, and languages.
 * Unlike entity repos, these use fixed endpoints without ID-based access.
 *
 * @param fetch - Authenticated $fetch instance ($geinsApi)
 * @returns Object with account, channel, currency, language sub-repos
 *
 * @example
 * ```ts
 * const global = globalRepo($geinsApi);
 * const account = await global.account.get();
 * const channels = await global.channel.list();
 * ```
 */
export const globalRepo = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
  account: {
    async get(): Promise<Account> {
      return await fetch<Account>(ENDPOINTS.ACCOUNT);
    },
  },
  channel: {
    async list(options?: ChannelApiOptions): Promise<ChannelListItem[]> {
      return await fetch<ChannelListItem[]>(ENDPOINTS.CHANNELS, {
        query: buildQueryObject(options),
      });
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
