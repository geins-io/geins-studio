import type { Session } from '#shared/types';

/**
 * Nuxt plugin for handling Geins API requests.
 *
 * This plugin sets up a custom `$fetch` instance with authentication handling
 * for the Geins API. It manages token refresh and retries requests with a new
 * token if the previous one has expired.
 *
 * @returns An object providing the `$geinsApi` instance to the Nuxt app, accessible via `useNuxtApp().$geinsApi`.
 *
 * @remarks
 * The plugin uses the `useGeinsAuth` composable to manage authentication state and token refresh.
 * It intercepts API requests to check token expiration and refresh the token if necessary.
 * If a request fails with a 401 status, it attempts to refresh the token and retry the request.
 */

export default defineNuxtPlugin(() => {
  const { geinsLog, geinsLogError } = useGeinsLog('app/plugins/geins-api.ts');
  const {
    isAuthenticated,
    accessToken,
    isRefreshing,
    accountKey,
    refresh,
    setIsRefreshing,
    isExpired,
    expiresSoon,
  } = useGeinsAuth();

  let refreshPromise: Promise<Session> | null = null;

  /**
   * Refreshes the authentication token.
   *
   * This function checks if there is an ongoing token refresh process. If not, it initiates a new token refresh process.
   * It sets the `isRefreshing` state to true, attempts to refresh the token, and handles any errors by logging out the user.
   * Once the refresh process is complete, it resets the `isRefreshing` state and clears the `refreshPromise`.
   *
   * @returns {Promise<Session>} A promise that resolves to the new session.
   * @throws Will throw an error if the token refresh fails.
   */
  const refreshAuthToken = async (): Promise<Session> => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        setIsRefreshing(true);
        try {
          const newSession = await refresh();
          return newSession;
        } finally {
          setIsRefreshing(false);
          refreshPromise = null; // Clear the refresh promise after completion
        }
      })();
    }
    return refreshPromise;
  };

  /**
   * The `$fetch` instance for the Geins API.
   *
   * This instance is created using the nuxt `$fetch.create` method.
   * It intercepts requests to add the authentication token to the headers.
   * If the token has expired, it refreshes the token before retrying the request.
   * If a request fails with a 401 status, it attempts to refresh the token and retry the request.
   *
   * @example
   * ```ts
   * const response = await $geinsApi('/users', {
   *  method: 'POST',
   *  body: JSON.stringify({ name: 'John Doe' }),
   * });
   * ```
   * */
  const geinsApi = $fetch.create({
    baseURL: '/api',
    retryStatusCodes: [401, 408, 409, 425, 429, 500, 502, 503, 504],
    retry: 1,
    retryDelay: 1000,
    async onRequest({ options }) {
      try {
        // Check token expiration
        if (isExpired() || expiresSoon()) {
          if (!isRefreshing.value) {
            await refreshAuthToken();
          } else {
            await refreshPromise; // Wait for the ongoing refresh to complete
          }
        }
        // Set the content type header
        options.headers.set('content-type', 'application/json');
        // Add the token to the request
        if (isAuthenticated.value && accessToken.value) {
          options.headers.set('x-access-token', `${accessToken.value}`);
        }
        // Add the account key to the request
        if (accountKey.value) {
          options.headers.set('x-account-key', accountKey.value);
        }
      } catch (error) {
        geinsLogError('error during request setup', error);
      }
    },
    async onRequestError({ error }) {
      geinsLogError('request error', error);
      throw error;
    },
    async onResponse({ response }) {
      if (response.status === 200) {
        geinsLog(
          response.url,
          '::: response success ::: data:',
          response?._data,
        );
      }
    },
    async onResponseError({ response }) {
      geinsLogError(
        response.url,
        '::: response error ::: data:',
        response?._data,
      );
      if (response.status === 401) {
        throw { status: response.status, message: 'Unauthorized' };
      } else if (response.status === 403) {
        throw { status: response.status, message: 'Insufficient permissions' };
      } else if (response.status === 404) {
        throw { status: response.status, message: 'Resource not found' };
      }
    },
  });

  return {
    provide: {
      geinsApi,
    },
  };
});
