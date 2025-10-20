import { defineStore } from 'pinia';
import type { Account, Channel, Currency } from '#shared/types';

export const useAccountStore = defineStore('account', () => {
  const { geinsLogWarn } = useGeinsLog('store/account.ts');
  const { globalApi } = useGeinsRepository();
  const { fallback } = useRuntimeConfig().public;

  // STATE
  const account = ref<Account>();
  const channels = ref<Channel[]>([]);
  const currencies = ref<Currency[]>([]);
  const languages = ref<Language[]>([]);
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
    const data = await globalApi.account.get();
    account.value = data;
    return data;
  }
  async function fetchChannels(): Promise<Channel[]> {
    const data = await globalApi.channel.list();
    channels.value = data;
    return data;
  }
  async function fetchCurrencies(): Promise<Currency[]> {
    const data = await globalApi.currency.list();
    currencies.value = data;
    return data;
  }
  async function fetchLanguages(): Promise<Language[]> {
    const data = await globalApi.language.list();
    languages.value = data;
    return data;
  }
  async function init(): Promise<void> {
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
        let callName = '';
        switch (index) {
          case 0:
            callName = 'account';
            break;
          case 1:
            callName = 'channels';
            break;
          case 2:
            callName = 'currencies';
            break;
          case 3:
            callName = 'languages';
            break;
        }
        geinsLogWarn(`error fetching ${callName}:`, result);
      }
    });

    // Set default currency from account
    if (account.value) {
      currentCurrency.value = account.value.defaultCurrency;
    }
  }

  function reset(): void {
    account.value = undefined;
    channels.value = [];
    currencies.value = [];
    languages.value = [];
    ready.value = false;
  }

  function getChannelNameById(id: string): string {
    return getEntityNameById(id, channels.value);
  }

  function getCountryNameById(id: string): string {
    return getEntityNameById(id, currentCountries.value);
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
    init,
    reset,
    getChannelNameById,
    getCountryNameById,
    getDefaultCountryByChannelId,
    getCurrenciesByChannelId,
    currentChannel,
    currentCountries,
    currentCurrencies,
  };
});
