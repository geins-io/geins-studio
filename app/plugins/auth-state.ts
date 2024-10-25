export default defineNuxtPlugin((_nuxtApp) => {
  const { data, status, signOut } = useAuth();
  watch(
    () => data.value?.isAuthorized,
    (isAuthorized) => {
      if (!isAuthorized && status.value === 'authenticated') {
        clearError();
        signOut();
      }
    },
    { deep: true },
  );
});
