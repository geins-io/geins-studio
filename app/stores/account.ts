import { defineStore } from 'pinia';
import type { Account, Channel, Currency } from '#shared/types';

export const useAccountStore = defineStore('account', () => {
  const { geinsLogWarn } = useGeinsLog('store/account.ts');
  const api = repository(useNuxtApp().$geinsApi);
  const { fallback } = useRuntimeConfig().public;

  // STATE
  const account = ref<Account>();
  const channels = ref<Channel[]>([]);
  const currencies = ref<Currency[]>([]);
  const languages = ref<Language[]>([]);
  const ready = ref(false);
  const currentChannelId = useCookie('geins-channel', {
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
    const data = await api.account.get();
    account.value = data;
    return data;
  }
  async function fetchChannels(): Promise<Channel[]> {
    const data = await api.channel.list();
    channels.value = data;
    return data;
  }
  async function fetchCurrencies(): Promise<Currency[]> {
    const data = await api.currency.list();
    currencies.value = data;
    return data;
  }
  async function fetchLanguages(): Promise<Language[]> {
    const data = await api.language.list();
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

  // GETTERS
  const currentChannel = computed(() => {
    return channels.value?.find(
      (channel) => channel._id === currentChannelId.value,
    );
  });

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
    currentChannel,
  };
});
