import { defineStore } from 'pinia';
import type { Account, Channel, Currency } from '#shared/types';

export const useAccountStore = defineStore('account', () => {
  const { geinsLogWarn } = useGeinsLog('store/account.ts');
  const api = repository(useNuxtApp().$geinsApi);

  // STATE
  const account = ref<Account>();
  const channels = ref<Channel[]>();
  const currencies = ref<Currency[]>();
  const languages = ref<Language[]>();
  const ready = ref(false);

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
  }

  function reset(): void {
    account.value = undefined;
    channels.value = [];
    currencies.value = [];
    languages.value = [];
    ready.value = false;
  }

  // GETTERS
  const defaultCurrency = computed(
    () => account.value?.defaultCurrency || 'SEK',
  );

  return {
    account,
    channels,
    currencies,
    languages,
    ready,
    fetchAccount,
    fetchChannels,
    fetchCurrencies,
    fetchLanguages,
    init,
    reset,
    defaultCurrency,
  };
});
