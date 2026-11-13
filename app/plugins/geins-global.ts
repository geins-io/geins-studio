export default defineNuxtPlugin(async (_nuxtApp) => {
  const accountStore = useAccountStore();
  const productsStore = useProductsStore();
  const userStore = useUserStore();
  const { isAuthenticated } = useGeinsAuth();

  // Prevent execution on the server
  if (import.meta.server) return;

  // If user is authenticated, initialize the stores. The user is awaited:
  // pages read it synchronously (e.g. per-user cookies).
  if (isAuthenticated.value) {
    accountStore.init();
    await userStore.init();
    return;
  }

  // Watch for authentication changes. A refresh keeps the last session until
  // the new one arrives, so it never reads as a logout here.
  watch(
    isAuthenticated,
    async (value) => {
      if (value) {
        accountStore.init();
        userStore.init();
      } else {
        accountStore.reset();
        productsStore.reset();
        userStore.reset();
      }
    },
    { immediate: false }, // Avoid triggering the watcher immediately
  );
});
