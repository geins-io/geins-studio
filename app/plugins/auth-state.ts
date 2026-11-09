import { promiseTimeout, useEventListener } from '@vueuse/core';

const REFRESH_CHECK_INTERVAL_MS = 60_000;
// Long enough for another tab's (or lambda's) token rotation to land in the
// shared cookie before a `RefreshTokenInvalid` session is re-read.
const INVALID_RECHECK_DELAY_MS = 1_500;

export default defineNuxtPlugin(async (_nuxtApp) => {
  const router = useRouter();
  const { geinsLogWarn } = useGeinsLog('plugins/auth-state.ts');
  const {
    authStateDiffers,
    session,
    sessionError,
    isAuthenticated,
    accountKey,
    authSignal,
    refresh,
    syncSession,
    isExpired,
    expiresSoon,
    logout,
  } = useGeinsAuth();

  // Another tab's login, account switch, refresh or logout. Each tab re-reads
  // its own session (the cookie is shared) and acts on what it finds, so one
  // tab's failed fetch can never log out the others.
  watch(authSignal, async (signal) => {
    if (!signal) {
      return;
    }
    const previousAccountKey = accountKey.value;
    try {
      await syncSession();
    } catch (error) {
      geinsLogWarn(`syncing the session after ${signal.type} failed:`, error);
      return;
    }
    const onAuthPage = router.currentRoute.value.path.startsWith('/auth');
    if (!isAuthenticated.value) {
      if (signal.type === 'signed-out' && !onAuthPage) {
        await navigateTo('/auth/login', { external: true });
      }
      return;
    }
    if (onAuthPage) {
      await navigateTo('/');
    } else if (previousAccountKey && accountKey.value !== previousAccountKey) {
      // Full reload: this tab's stores and open page hold the previous
      // account's data.
      await navigateTo('/', { external: true });
    }
  });

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

  // Refresh before the token expires instead of on the next API call, and as
  // soon as a tab becomes visible again: timers don't run while a laptop sleeps.
  const refreshIfDue = async () => {
    if (!isAuthenticated.value || !(isExpired() || expiresSoon())) {
      return;
    }
    try {
      await refresh();
    } catch (error) {
      geinsLogWarn('proactive refresh failed:', error);
    }
  };
  usePollWhile(isAuthenticated, refreshIfDue, REFRESH_CHECK_INTERVAL_MS);
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refreshIfDue();
    }
  });

  // Logging out is this tab's deliberate decision, never a side effect of a
  // failed fetch. A `RefreshTokenInvalid` session is re-read once first:
  // another tab or lambda may have just rotated the token.
  const authStateHandler = async () => {
    if (session.value?.mfaActive || !authStateDiffers.value) {
      return;
    }
    if (sessionError.value === 'RefreshTokenInvalid') {
      await promiseTimeout(INVALID_RECHECK_DELAY_MS);
      try {
        await refresh();
      } catch (error) {
        geinsLogWarn('re-checking an invalid session failed:', error);
      }
      if (!authStateDiffers.value) {
        return;
      }
    }
    clearError();
    await logout();
  };

  watch(authStateDiffers, authStateHandler, { immediate: true });
});
