import { useBroadcastChannel, useDebounceFn } from '@vueuse/core';
import type { Session } from '#shared/types';
interface AuthBroadcastData {
  session?: Session | null;
  isRefreshing: boolean;
}

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { route } = useRoute();
  const {
    authStateDiffers,
    session,
    isAuthenticated,
    accessToken,
    isRefreshing,
    setIsRefreshing,
    setSession,
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
    console.log('🚀 ~ broadcastChange');
  }, 1000);

  watch(
    [isAuthenticated, accessToken, isRefreshing],
    (newValues, oldValues) => {
      if (newValues.some((newVal, index) => newVal !== oldValues[index])) {
        broadcastChange();
      }
    },
  );

  watch(
    broadcastData,
    () => {
      console.log('🚀 ~ broadcastData received');
      if (broadcastData.value.isRefreshing !== isRefreshing.value) {
        setIsRefreshing(broadcastData.value.isRefreshing);
        geinsLog('isRefreshing set:', broadcastData.value.isRefreshing);
      }
      let broadcastedSession: Session = {};
      let currentSession: Session = {};
      if (broadcastData.value.session) {
        broadcastedSession = toRaw(broadcastData.value.session) as Session;
        console.log(
          '🚀 ~ defineNuxtPlugin ~ broadcastedSession:',
          broadcastedSession,
        );
        delete broadcastedSession.expires;
      }
      if (session.value) {
        currentSession = toRaw(session.value) as Session;
        console.log(
          '🚀 ~ defineNuxtPlugin ~ currentRawSession:',
          currentSession,
        );
        delete currentSession.expires;
      }
      if (
        JSON.stringify(broadcastedSession) !== JSON.stringify(currentSession)
      ) {
        setSession(broadcastedSession);
        geinsLog('new session set:', broadcastedSession);
      }
    },
    { deep: true },
  );

  // Watch for changes in the auth state to set the cookie that is used for the app skeleton state
  watch(
    isAuthenticated,
    (newValue, oldValue) => {
      console.log('🚀 ~ defineNuxtPlugin ~ isAuthenticated:', newValue);
      const cookieSettings: { expires?: Date } = {};
      if (session.value?.expires) {
        cookieSettings.expires = new Date(session.value?.expires);
      }
      const authCookie = useCookie<boolean>('geins-auth', cookieSettings);
      authCookie.value = newValue;
      // Handle redirects to root when auhtenticated and /auth/login when getting logged out
      // HANDLE REDIRECTS HERE
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
