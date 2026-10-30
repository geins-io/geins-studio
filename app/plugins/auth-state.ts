import {
  promiseTimeout,
  useBroadcastChannel,
  useDebounceFn,
  useEventListener,
} from '@vueuse/core';
import type { Session, AuthBroadcastData } from '#shared/types';

const REFRESH_CHECK_INTERVAL_MS = 60_000;
// Long enough for another tab's (or lambda's) token rotation to land in the
// shared cookie before a `RefreshTokenInvalid` session is re-read.
const INVALID_RECHECK_DELAY_MS = 1_500;

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { meta: routeMeta } = useRoute();
  const { geinsLogWarn } = useGeinsLog('plugins/auth-state.ts');
  const {
    authStateDiffers,
    session,
    sessionError,
    isAuthenticated,
    accessToken,
    refresh,
    isExpired,
    expiresSoon,
    setSession,
    sessionsAreEqual,
    logout,
  } = useGeinsAuth();
  const { data: broadcastData, post: broadcastPost } = useBroadcastChannel<
    AuthBroadcastData,
    AuthBroadcastData
  >({
    name: 'geins-auth',
  });

  // Debounced function to broadcast changes
  const broadcastChange = useDebounceFn(() => {
    broadcastPost({
      session: toRaw(session.value),
    });
  }, 500);

  // Watch for changes to isAuthenticated and accessToken
  watch([isAuthenticated, accessToken], async (newValues, oldValues) => {
    if (newValues.some((newVal, index) => newVal !== oldValues[index])) {
      broadcastChange();
      if (newValues[0] === true && routeMeta.layout === 'auth') {
        await navigateTo('/');
      }
    }
  });

  // Watch for changes to broadcastData
  watch(
    broadcastData,
    async () => {
      let broadcastedSession: Session = {};
      let currentSession: Session = {};
      if (broadcastData.value.session) {
        broadcastedSession = toRaw(broadcastData.value.session);
      }
      if (session.value) {
        currentSession = toRaw(session.value);
      }
      if (!sessionsAreEqual(broadcastedSession, currentSession)) {
        if (
          broadcastedSession?.isAuthenticated === false ||
          Object.keys(broadcastedSession).length === 0
        ) {
          await logout();
          return;
        }
        setSession(broadcastedSession);
      }
    },
    { deep: true },
  );

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
