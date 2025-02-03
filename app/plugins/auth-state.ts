export default defineNuxtPlugin(async (_nuxtApp) => {
  const { authStateDiffers, session, isAuthenticated, logout } = useGeinsAuth();

  // Watch for changes in the auth state to set the cookie that is used for the app skeleton state
  watch(
    isAuthenticated,
    (value) => {
      const cookieSettings: { expires?: Date } = {};
      if (session.value?.expires) {
        cookieSettings.expires = new Date(session.value?.expires);
      }

      const authCookie = useCookie<boolean>('geins-auth', cookieSettings);

      authCookie.value = value;
    },
    { immediate: true },
  );

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
