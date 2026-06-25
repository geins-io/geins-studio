import type { GeinsApiError, GeinsApiFetch, Session } from '#shared/types';
import { resolveAppId } from '#shared/utils/app';
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
  const { geinsLog, geinsLogError } = useGeinsLog('plugins/geins-api.ts');
  // Suppression check + the global error toast emitter both live in the
  // useApiErrorToast composable. Keeping NuxtApp/$i18n out of THIS file is
  // deliberate: referencing them here re-instantiates the provided
  // $geinsApiFetchInstance type and tips Nitro's route-type resolution over
  // the "excessive stack depth" limit (see the GeinsApiFetch note below).
  const { isSuppressed, showGlobalErrorToast } = useApiErrorToast();
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
  const appId = resolveAppId(
    useRuntimeConfig().public.appId as string,
    window.location.hostname,
  );

  // Create a WeakMap to store refresh promises per user session
  // This prevents shared state between different users
  const refreshPromises = new WeakMap<object, Promise<Session>>();

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
    // Use the session object as a key to ensure per-user refresh promises
    const sessionKey = { id: accessToken.value || 'anonymous' };

    let currentRefreshPromise = refreshPromises.get(sessionKey);
    if (!currentRefreshPromise) {
      currentRefreshPromise = (async () => {
        setIsRefreshing(true);
        try {
          const newSession = await refresh();
          return newSession;
        } finally {
          setIsRefreshing(false);
          refreshPromises.delete(sessionKey); // Clear the refresh promise after completion
        }
      })();
      refreshPromises.set(sessionKey, currentRefreshPromise);
    }
    return currentRefreshPromise;
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
  const geinsApiFetchInstance = $fetch.create({
    baseURL: '/api',
    // 500 deliberately excluded — it is often a non-idempotent server fault and
    // a blind retry just doubles the failure count
    retryStatusCodes: [401, 502, 503, 504],
    retry: 1,
    retryDelay: 1000,
    async onRequest({ options }) {
      try {
        // Check token expiration
        if (isExpired() || expiresSoon()) {
          if (!isRefreshing.value) {
            await refreshAuthToken();
          } else {
            // Wait for the ongoing refresh to complete
            const sessionKey = { id: accessToken.value || 'anonymous' };
            const currentRefreshPromise = refreshPromises.get(sessionKey);
            if (currentRefreshPromise) {
              await currentRefreshPromise;
            }
          }
        }
        // Set the content type header
        if (
          !options.headers.get('content-type') &&
          !(options.body instanceof FormData)
        ) {
          options.headers.set('content-type', 'application/json');
        }
        // Add the token to the request
        if (isAuthenticated.value && accessToken.value) {
          options.headers.set('x-access-token', `${accessToken.value}`);
        }
        // Add the account key to the request
        if (accountKey.value) {
          options.headers.set('x-account-key', accountKey.value);
        }
        options.headers.set('x-app', appId);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        geinsLogError('error during request setup', errorMessage);
      }
    },
    async onRequestError({ error, options, request }) {
      const timestamp = new Date().toISOString();

      // Determine error type based on error properties
      let errorType: GeinsErrorType = 'NETWORK_ERROR';

      if (error.name === 'AbortError') {
        errorType = 'CANCELLED_ERROR';
      } else if (error.name === 'TimeoutError') {
        errorType = 'TIMEOUT_ERROR';
      }

      const method = options.method || 'GET';
      const url = String(request);

      // Capture the network cause — for a connection-level failure this is the
      // only useful signal, and it is non-enumerable on the raw Error so it
      // would otherwise be lost when the error is serialised for logging.
      const rawCause = (error as { cause?: unknown }).cause;
      const cause =
        rawCause && typeof rawCause === 'object'
          ? {
              name: (rawCause as { name?: string }).name,
              code: (rawCause as { code?: string }).code,
              message: (rawCause as { message?: string }).message,
            }
          : undefined;

      const geinsApiError: GeinsApiError = {
        status: 0,
        method,
        url,
        message: error.message,
        timestamp,
        type: errorType,
        originalError: error,
        cause,
      };

      geinsLogError(
        `[${method}] ${url} ::: request error ::: ${error.message}${
          cause?.code ? ` (cause: ${cause.code})` : ''
        } ::: `,
        geinsApiError,
      );
      throw geinsApiError;
    },
    async onResponse({ response, options }) {
      const method = options.method || 'GET';

      if (response.status >= 200 && response.status < 300) {
        const logMessage = `[${method}] ${response.url} ::: success`;
        const logData =
          response._data !== undefined
            ? [logMessage, '::: data:', response._data]
            : [logMessage];
        geinsLog(...logData);
      }
    },
    async onResponseError({ response, options }) {
      const errorData = response?._data || {};
      const url = response.url;
      const method = options.method || 'GET';

      const geinsApiError: GeinsApiError = {
        status: response.status,
        method,
        url,
        message: getFallbackErrorMessage(response.status, errorData),
        timestamp: new Date().toISOString(),
        type: getErrorType(response.status),
        originalError: errorData,
      };

      // Flag responses that $fetch will auto-retry (matches retryStatusCodes
      // above) so a retried call is visible in the logs rather than looking
      // like two unrelated failures.
      const willRetry = [401, 502, 503, 504].includes(response.status);
      geinsLogError(
        `[${method}] ${url} ::: response error ::: ${response.status}${
          willRetry ? ' (retryable)' : ''
        } ::: `,
        geinsApiError,
      );

      // Surface mutation failures globally. Reads (GET/HEAD) render page-level
      // error/empty states instead, and 401 is the silent token refresh/retry
      // path. Flows that opt out (e.g. silent auto-saves, or pages that show
      // their own richer error toast) set the suppression flag via
      // useApiErrorToast.
      const isMutation = !['GET', 'HEAD'].includes(method.toUpperCase());
      if (isMutation && response.status !== 401 && !isSuppressed()) {
        void showGlobalErrorToast(geinsApiError, errorData);
      }

      throw geinsApiError;
    },
  });

  /**
   * Typed wrapper around the $fetch instance for direct API calls.
   * Uses the GeinsApiFetch interface which avoids Nitro's complex
   * route type resolution that causes excessive TypeScript stack depth.
   * All auth interceptors from the underlying $fetch instance are preserved.
   */
  const geinsApi: GeinsApiFetch = (request, options) =>
    geinsApiFetchInstance(request, options);

  return {
    provide: {
      geinsApi,
      geinsApiFetchInstance,
    },
  };
});
