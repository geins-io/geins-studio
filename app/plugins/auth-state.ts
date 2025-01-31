export default defineNuxtPlugin(async (_nuxtApp) => {
  const { authCookie, authStateDiffers, session, isAuthenticated, logout } =
    useGeinsAuth();

  //watch isAuthenticated and set authCookie accordingly
  watch(isAuthenticated, (value) => {
    console.log('🤪 ~ WATCH isAuthenticated ~ value:', value);
    authCookie.value = value;
  });

  const authStateHandler = async () => {
    if (session.value?.mfaActive) {
      return;
    }
    if (authStateDiffers.value) {
      clearError();
      await logout();
    }
  };

  await authStateHandler();

  watch(
    () => authStateDiffers,
    async () => await authStateHandler(),
  );
});
