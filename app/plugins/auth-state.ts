export default defineNuxtPlugin(async (_nuxtApp) => {
  const { authStateDiffers, session, logout } = useGeinsAuth();

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
