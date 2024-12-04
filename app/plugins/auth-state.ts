import type { Session } from '@/types/auth/Auth';

export default defineNuxtPlugin((_nuxtApp) => {
  const { data, status, signOut } = useAuth();

  const authStateHandler = (session?: Session | null) => {
    if (session?.mfaActive) {
      return;
    }
    if (!session?.isAuthorized && status.value === 'authenticated') {
      clearError();
      signOut();
    }
  };

  authStateHandler(data?.value);

  watch(
    () => data?.value?.isAuthorized,
    () => authStateHandler(data?.value),
    { deep: true },
  );
});
