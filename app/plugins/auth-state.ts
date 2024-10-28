export default defineNuxtPlugin((_nuxtApp) => {
  const { data, status, signOut } = useAuth();

  const authStateHandler = (isAuthorized?: boolean) => {
    if (!isAuthorized && status.value === 'authenticated') {
      clearError();
      signOut();
    }
  };

  authStateHandler(data?.value?.isAuthorized);

  watch(
    () => data?.value?.isAuthorized,
    (isAuthorized) => authStateHandler(isAuthorized),
    { deep: true },
  );
});
