export default defineNuxtPlugin(async (_nuxtApp) => {
  if (import.meta.server) return;

  const { $geinsApi } = useNuxtApp();
  const api = repository($geinsApi);

  api.account.get().then((account) => {
    const { setCurrentAccount } = useAccountStore();
    setCurrentAccount(account);
  });
  api.channel.list().then((channels) => {
    const { setCurrentChannels } = useAccountStore();
    setCurrentChannels(channels);
  });
  api.currency.list().then((currencies) => {
    const { setCurrentCurrencies } = useAccountStore();
    setCurrentCurrencies(currencies);
  });
  api.language.list().then((languages) => {
    const { setCurrentLanguages } = useAccountStore();
    setCurrentLanguages(languages);
  });
});
