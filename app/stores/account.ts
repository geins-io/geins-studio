import { defineStore } from 'pinia';
import type { Account, Channel, Currency } from '#shared/types';

export const useAccountStore = defineStore('account', () => {
  const { geinsLogError } = useGeinsLog('store/account.ts');
  const api = repository(useNuxtApp().$geinsApi);

  // STATE
  const currentAccount = ref<Account>();
  const currentChannels = ref<Channel[]>();
  const currentCurrencies = ref<Currency[]>();
  const currentLanguages = ref<Language[]>();
  const ready = ref(false);

  // ACTIONS
  async function fetchAccount(): Promise<Account> {
    const account = await api.account.get();
    currentAccount.value = account;
    return account;
  }
  async function fetchChannels(): Promise<Channel[]> {
    const channels = await api.channel.list();
    currentChannels.value = channels;
    return channels;
  }
  async function fetchCurrencies(): Promise<Currency[]> {
    const currencies = await api.currency.list();
    currentCurrencies.value = currencies;
    return currencies;
  }
  async function fetchLanguages(): Promise<Language[]> {
    const languages = await api.language.list();
    currentLanguages.value = languages;
    return languages;
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
        geinsLogError(`error fetching ${callName}:`, result);
      }
    });
  }

  // GETTERS
  const defaultCurrency = computed(
    () => currentAccount.value?.defaultCurrency || 'SEK',
  );

  return {
    currentAccount,
    currentChannels,
    currentCurrencies,
    currentLanguages,
    ready,
    init,
    fetchAccount,
    fetchChannels,
    fetchCurrencies,
    fetchLanguages,
    defaultCurrency,
  };
});
