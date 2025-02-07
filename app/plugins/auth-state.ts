import { useBroadcastChannel, useDebounceFn } from '@vueuse/core';
import type { Session, AuthBroadcastData } from '#shared/types';

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { meta: routeMeta } = useRoute();
  const {
    authStateDiffers,
    session,
    isAuthenticated,
    accessToken,
    isRefreshing,
    setIsRefreshing,
    setSession,
    sessionsAreEqual,
    logout,
  } = useGeinsAuth();
  const { geinsLog, geinsLogInfo } = useGeinsLog('app/plugins/auth-state.ts');
  const { data: broadcastData, post: broadcastPost } = useBroadcastChannel<
    AuthBroadcastData,
    AuthBroadcastData
  >({
    name: 'geins-auth',
  });

  // Log session data
  geinsLogInfo('session:', session.value);

  const broadcastChange = useDebounceFn(() => {
    broadcastPost({
      session: toRaw(session.value),
      isRefreshing: isRefreshing.value,
    });
  }, 500);

  watch(
    [isAuthenticated, accessToken, isRefreshing],
    async (newValues, oldValues) => {
      if (newValues.some((newVal, index) => newVal !== oldValues[index])) {
        broadcastChange();
        if (newValues[0] === true && routeMeta.layout === 'auth') {
          await navigateTo('/');
        }
      }
    },
  );

  watch(
    broadcastData,
    async () => {
      const refreshing = Boolean(broadcastData.value?.isRefreshing);
      let broadcastedSession: Session = {};
      let currentSession: Session = {};
      if (refreshing !== isRefreshing.value) {
        setIsRefreshing(refreshing);
        geinsLog('isRefreshing set:', refreshing);
      } else if (broadcastData.value.session) {
        broadcastedSession = toRaw(broadcastData.value.session);
      }
      if (session.value) {
        currentSession = structuredClone(toRaw(session.value));
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

  const authStateHandler = async () => {
    if (session.value?.mfaActive) {
      return;
    }
    if (authStateDiffers.value) {
      clearError();
      await logout();
    }
  };

  watch(
    () => authStateDiffers,
    async () => await authStateHandler(),
    { immediate: true },
  );
});
