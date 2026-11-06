export default defineNuxtPlugin(async (_nuxtApp) => {
  const accountStore = useAccountStore();
  const productsStore = useProductsStore();
  const userStore = useUserStore();
  const { isAuthenticated } = useGeinsAuth();
  const { status } = useAuth();

  // Prevent execution on the server
  if (import.meta.server) return;

  // If user is authenticated, initialize the stores. The user is awaited:
  // pages read it synchronously (e.g. per-user cookies).
  if (isAuthenticated.value) {
    accountStore.init();
    await userStore.init();
    return;
  }

  // A token refresh puts nuxt-auth in 'loading', which reads as logged out.
  // Hold the last settled value through it, or every refresh resets the stores
  // (and drops their in-flight loads) mid-session.
  let settled: boolean = isAuthenticated.value;
  const settledAuth = () =>
    status.value === 'loading' ? settled : isAuthenticated.value;

  // Watch for authentication changes
  watch(
    settledAuth,
    async (value) => {
      settled = value;
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
