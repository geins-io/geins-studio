import { defineStore } from 'pinia';
import type {
  Account,
  ChannelListItem,
  Currency,
  Language,
  Market,
} from '#shared/types';

/**
 * Account store — manages the current merchant account context.
 *
 * State: account details, channels, currencies, languages, markets, and user-selected
 * preferences (persisted in cookies with `geins-` prefix).
 *
 * Initialization: call `init()` after authentication. The `geins-global.ts` plugin
 * handles this automatically when `isAuthenticated` changes.
 *
 * This is the authoritative cache for account-scoped list data. Consumers should
 * read from the store instead of fetching directly. Use the refresh actions
 * (`refreshChannels`, `refreshMarkets`, etc.) after mutations.
 *
 * @example
 * ```ts
 * const accountStore = useAccountStore();
 * const { channels, currentCurrency } = storeToRefs(accountStore);
 * await accountStore.init();
 * ```
 */
export const useAccountStore = defineStore('account', () => {
  const { geinsLogWarn } = useGeinsLog('store/account.ts');
  const { accountApi } = useGeinsRepository();
  const { fallback } = useRuntimeConfig().public;

  // STATE
  const account = ref<Account>();
  const channels = ref<ChannelListItem[]>([]);
  const currencies = ref<Currency[]>([]);
  const languages = ref<Language[]>([]);
  const markets = ref<Market[]>([]);
  const marketsLoaded = ref(false);
  const ready = ref(false);
  const currentChannelId = useCookie<string>('geins-channel', {
    default: () => fallback.channel.toString(),
  });
  const currentLanguage = useCookie('geins-language', {
    default: () => fallback.language,
  });
  const currentCurrency = useCookie('geins-currency', {
    default: () => fallback.currency,
  });

  // ACTIONS
  async function fetchAccount(): Promise<Account> {
    const data = await accountApi.account.get();
    account.value = data;
    return data;
  }
  async function fetchChannels(): Promise<ChannelListItem[]> {
    const data = await accountApi.channel.list({
      fields: ['languages', 'markets'],
    });
    channels.value = data;
    return data;
  }
  async function fetchCurrencies(): Promise<Currency[]> {
    const data = await accountApi.currency.list();
    currencies.value = data;
    return data;
  }
  async function fetchLanguages(): Promise<Language[]> {
    const data = await accountApi.language.list();
    languages.value = data;
    return data;
  }
  async function fetchMarkets(): Promise<Market[]> {
    const data = await accountApi.market.list();
    markets.value = Array.isArray(data) ? data : [];
    marketsLoaded.value = true;
    return markets.value;
  }
  /**
   * Fetch markets only if not already loaded. Safe to call multiple times.
   * Markets are only needed when adding markets to a channel — not on app init.
   */
  async function ensureMarkets(): Promise<Market[]> {
    if (marketsLoaded.value) return markets.value;
    return fetchMarkets();
  }
  async function init(): Promise<void> {
    const callNames = ['account', 'channels', 'currencies', 'languages'];
    const results = await Promise.allSettled([
      fetchAccount(),
      fetchChannels(),
      fetchCurrencies(),
      fetchLanguages(),
    ]);

    ready.value = results.every(
      (result) => result.status === 'fulfilled' && result.value,
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected' || !result.value) {
        geinsLogWarn(`error fetching ${callNames[index]}:`, result);
      }
    });

    // Set default currency from account
    if (account.value) {
      currentCurrency.value = account.value.defaultCurrency;
    }
  }

  // Granular refresh actions for use after mutations
  const refreshChannels = fetchChannels;
  const refreshMarkets = fetchMarkets; // forces a re-fetch regardless of cache
  const refreshLanguages = fetchLanguages;

  function reset(): void {
    account.value = undefined;
    channels.value = [];
    currencies.value = [];
    languages.value = [];
    markets.value = [];
    ready.value = false;
  }

  function getChannelNameById(id: string): string {
    return getEntityNameById(id, channels.value);
  }

  function getCountryNameById(id: string): string {
    return getEntityNameById(id, currentCountries.value);
  }

  function getMarketNameById(id: string): string {
    const market = channels.value
      ?.flatMap((channel) => channel.markets)
      .find((market) => market._id === String(id));
    const country = market?.country.name || '';
    const currency = market?.currency._id || '';
    return `${country} (${currency})`;
  }

  function getDefaultCountryByChannelId(channelId: string): string {
    const channel = channels.value.find((c) => c._id === String(channelId));

    if (!channel) return fallback.country;
    const defaultMarket = channel.markets.find(
      (market) => market._id === String(channel.defaultMarket),
    );
    return defaultMarket ? defaultMarket.country._id : '';
  }

  function getCurrenciesByChannelId(channelId: string): string[] {
    if (!channels.value || channels.value.length === 0) {
      return currentCurrencies.value.length > 0
        ? currentCurrencies.value.map((currency) => currency._id)
        : [];
    }
    const channel = channels.value.find((c) => c._id === String(channelId));

    if (!channel) return [];

    return channel.markets
      .filter((market) => !market.virtual)
      .map((market) => market.currency._id)
      .filter(
        (currency, index, self) =>
          index === self.findIndex((c) => c === currency),
      );
  }

  // GETTERS
  const currentChannel = computed(() => {
    return channels.value.find(
      (channel) => channel._id === String(currentChannelId.value),
    );
  });

  const currentCountries = computed(() => {
    return (
      currentChannel.value?.markets
        .filter((market) => !market.virtual)
        .map((market) => {
          return market.country;
        }) || []
    );
  });

  const currentCurrencies = computed(() => {
    if (!currentChannel.value) return [];

    const currencies = currentChannel.value.markets
      .filter((market) => !market.virtual)
      .map((market) => {
        return market.currency;
      });

    return currencies.filter(
      (currency, index, self) =>
        index === self.findIndex((c) => c?._id === currency?._id),
    );
  });

  // ACTIONS

  return {
    account,
    channels,
    currencies,
    languages,
    ready,
    currentChannelId,
    currentLanguage,
    currentCurrency,
    fetchAccount,
    fetchChannels,
    fetchCurrencies,
    fetchLanguages,
    fetchMarkets,
    ensureMarkets,
    init,
    reset,
    refreshChannels,
    refreshMarkets,
    refreshLanguages,
    getChannelNameById,
    getCountryNameById,
    getMarketNameById,
    getDefaultCountryByChannelId,
    getCurrenciesByChannelId,
    currentChannel,
    currentCountries,
    currentCurrencies,
    markets,
  };
});
