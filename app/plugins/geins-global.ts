export default defineNuxtPlugin(async (_nuxtApp) => {
  const accountStore = useAccountStore();
  const productsStore = useProductsStore();
  const { isAuthenticated } = useGeinsAuth();

  // Prevent execution on the server
  if (import.meta.server) return;

  // If user is authenticated, initialize the account store
  if (isAuthenticated.value) {
    accountStore.init();
    return;
  }

  // Watch for authentication changes
  watch(
    isAuthenticated,
    async (value) => {
      if (value) {
        accountStore.init();
      } else {
        accountStore.reset();
        productsStore.reset();
      }
    },
    { immediate: false }, // Avoid triggering the watcher immediately
  );
});
