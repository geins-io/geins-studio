import { defineStore } from 'pinia';
import type { Account, Channel, Currency } from '#shared/types';

export const useAccountStore = defineStore('account', () => {
  // ACCOUNT
  const currentAccount = ref<Account>();
  function setCurrentAccount(account: Account) {
    currentAccount.value = account;
  }
  const defaultCurrency = computed(
    () => currentAccount.value?.defaultCurrency || 'SEK',
  );

  // CHANNELS
  const currentChannels = ref<Channel[]>();
  function setCurrentChannels(channels: Channel[]) {
    currentChannels.value = channels;
  }

  // CURRENCIES
  const currentCurrencies = ref<Currency[]>();
  function setCurrentCurrencies(currencies: Currency[]) {
    currentCurrencies.value = currencies;
  }

  // LANGUAGES
  const currentLanguages = ref<Language[]>();
  function setCurrentLanguages(languages: Language[]) {
    currentLanguages.value = languages;
  }

  return {
    currentAccount,
    currentChannels,
    currentCurrencies,
    currentLanguages,
    setCurrentAccount,
    setCurrentChannels,
    setCurrentCurrencies,
    setCurrentLanguages,
    defaultCurrency,
  };
});
