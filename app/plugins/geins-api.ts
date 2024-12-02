import type { Session } from '@/types/auth/Auth';

export default defineNuxtPlugin((_nuxtApp) => {
  const {
    isAuthorized,
    accessToken,
    isRefreshing,
    refresh,
    setIsRefreshing,
    isExpired,
    expiresSoon,
    logout,
  } = useGeinsAuth();

  let refreshPromise: Promise<Session> | null = null;

  const refreshAuthToken = async (): Promise<Session> => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        setIsRefreshing(true);
        try {
          const newSession = await refresh();
          return newSession;
        } catch (error) {
          logout();
          throw error;
        } finally {
          setIsRefreshing(false);
          refreshPromise = null; // Clear the refresh promise after completion
        }
      })();
    }
    return refreshPromise;
  };

  const geinsApi = $fetch.create({
    baseURL: '/api',
    async onRequest({ options }) {
      // Check token expiration
      if (isExpired() || expiresSoon()) {
        if (!isRefreshing.value) {
          await refreshAuthToken();
        } else {
          await refreshPromise; // Wait for the ongoing refresh to complete
        }
      }

      // Add the token to the request
      if (isAuthorized.value) {
        options.headers.set('Authorization', `Bearer ${accessToken.value}`);
      }
    },
    async onResponseError({ response, options }) {
      if (response.status === 401) {
        try {
          await refreshAuthToken(); // Refresh the token
          options.headers.set(
            'Authorization',
            `Bearer ${accessToken.value}`, // Retry with the new token
          );
          return await $fetch(response.url, options); // Retry the original request
        } catch (error) {
          logout();
          throw error;
        }
      }
      throw response; // Propagate other errors
    },
  });

  return {
    provide: {
      geinsApi,
    },
  };
});
