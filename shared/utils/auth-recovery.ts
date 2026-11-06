import type { Session } from '#shared/types';

/**
 * A `$geinsApi` response that failed, with what the tab knew when it came in.
 */
export interface FailedApiRequest {
  status: number;
  /** The access token the request carried, if it carried one. */
  sentToken?: string;
  /** The access token this tab holds now. */
  currentToken?: string;
  isAuthenticated: boolean;
  onAuthPage: boolean;
  /** The request is already the one retry after a 401. */
  retried: boolean;
}

/**
 * - `ignore`: not a rejected token; the error stands.
 * - `force-refresh`: refresh the token now, then retry the request.
 * - `retry`: the token was replaced since the request went out; retry with
 *   the new one.
 * - `logout`: the API rejected the token the forced refresh produced too.
 */
export type UnauthorizedAction =
  | 'ignore'
  | 'force-refresh'
  | 'retry'
  | 'logout';

/**
 * What a failed request means for the session. Only a 401 to a request that
 * carried a token, from a signed-in tab outside the auth pages, means the API
 * rejected the token: the login page and requests sent before sign-in get 401s
 * a refresh can't fix, and acting on them would loop.
 *
 * The server refreshes only a token that is expired or about to expire, so a
 * token the API rejects early (a rotated signing key, another environment's
 * token) would otherwise stay in use, and fail every call, until it expires.
 */
export const unauthorizedAction = ({
  status,
  sentToken,
  currentToken,
  isAuthenticated,
  onAuthPage,
  retried,
}: FailedApiRequest): UnauthorizedAction => {
  if (status !== 401 || !sentToken || !isAuthenticated || onAuthPage) {
    return 'ignore';
  }
  if (retried) {
    return 'logout';
  }
  return sentToken === currentToken ? 'force-refresh' : 'retry';
};

/**
 * - `retry`: there's a new token; retry the request with it.
 * - `logout`: no session is left at all.
 * - `fail`: the error stands. A `RefreshTokenInvalid` session is logged out by
 *   the auth-state plugin after its re-check; a `RefreshFailed` one is kept,
 *   and the next 401 forces another refresh.
 */
export type ForcedRefreshOutcome = 'retry' | 'logout' | 'fail';

/** What to do with the session a forced refresh of `rejectedToken` left. */
export const forcedRefreshOutcome = (
  session: Session | null | undefined,
  rejectedToken: string | undefined,
): ForcedRefreshOutcome => {
  if (session?.isAuthenticated) {
    return session.accessToken && session.accessToken !== rejectedToken
      ? 'retry'
      : 'fail';
  }
  return session?.error === 'RefreshTokenInvalid' ? 'fail' : 'logout';
};

export interface UnauthorizedRecoveryOptions {
  /**
   * Refreshes `rejectedToken` now and resolves with the session after it.
   * Concurrent callers must share one call (`useGeinsAuth().forceRefresh`).
   */
  forceRefresh: (
    rejectedToken: string | undefined,
  ) => Promise<Session | null | undefined>;
  logout: () => Promise<void>;
  onError?: (error: unknown) => void;
}

/**
 * Builds the handler `$geinsApi` runs on a failed response. It resolves `true`
 * when the request should be retried once with the token the tab now holds,
 * and `false` when the error stands. Concurrent failures start at most one
 * logout; a logout that fails can be tried again.
 */
export const createUnauthorizedRecovery = ({
  forceRefresh,
  logout,
  onError,
}: UnauthorizedRecoveryOptions) => {
  let loggingOut: Promise<void> | null = null;
  const logoutOnce = () => {
    loggingOut ??= logout().catch((error) => {
      loggingOut = null;
      onError?.(error);
    });
  };

  return async (request: FailedApiRequest): Promise<boolean> => {
    switch (unauthorizedAction(request)) {
      case 'ignore':
        return false;
      case 'retry':
        return true;
      case 'logout':
        logoutOnce();
        return false;
      case 'force-refresh':
        break;
    }
    let session: Session | null | undefined;
    try {
      session = await forceRefresh(request.sentToken);
    } catch (error) {
      // Couldn't reach our own session endpoint: as transient as a Geins 5xx,
      // so the session stays and the next 401 tries again.
      onError?.(error);
      return false;
    }
    const outcome = forcedRefreshOutcome(session, request.sentToken);
    if (outcome === 'logout') {
      logoutOnce();
    }
    return outcome === 'retry';
  };
};

const USER_LOAD_RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000];

/**
 * The pause before loading the signed-in user again after a failed attempt
 * (`attempt` counts from 0), or `undefined` to stop. Only transient failures
 * are retried: no response, 408, 429 and 5xx. They must never sign the user
 * out, and a 401 is the request flow's to handle.
 */
export const userLoadRetryDelay = (
  attempt: number,
  status: number | undefined,
): number | undefined => {
  const transient =
    status === 0 || status === 408 || status === 429 || (status ?? 0) >= 500;
  return transient ? USER_LOAD_RETRY_DELAYS_MS[attempt] : undefined;
};
