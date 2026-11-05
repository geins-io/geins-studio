import { jwtDecode } from 'jwt-decode';
import type { AuthResponse, Session } from '#shared/types';

/**
 * Error from a server-side call to a Geins auth endpoint. `status` is the HTTP
 * status, or `0` when no response came back (network failure or timeout).
 */
export class AuthApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AuthApiError';
    this.status = status;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    return typeof error.status === 'number' ? error.status : undefined;
  }
  return undefined;
};

/**
 * The token after a successful refresh: new tokens and expiry, same account,
 * and no `error`. Throws `AuthApiError` (a `RefreshFailed`) when the response
 * carries no usable access token.
 */
export const tokenAfterRefresh = (
  token: Session,
  response: AuthResponse,
): Session => {
  if (!response.accessToken) {
    throw new AuthApiError(502, 'Refresh response has no access token');
  }
  const { exp, iat } = jwtDecode(response.accessToken);
  return {
    isAuthenticated: true,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? token.refreshToken,
    accountKey: token.accountKey,
    tokenExpires: Number(exp),
    refreshedAt: Number(iat),
    mfaActive: false,
  };
};

// 4xx statuses that mean "try again later", not "this token is dead".
const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

const isRefreshRejected = (status: number | undefined): boolean =>
  status !== undefined &&
  status >= 400 &&
  status < 500 &&
  !RETRYABLE_CLIENT_STATUSES.has(status);

/**
 * The token to keep after a failed refresh. Never throws: next-auth 4 wipes the
 * session cookie when the jwt callback throws, which logged users out on any
 * Geins hiccup.
 *
 * - Any 4xx but 408 and 429: Geins rejected the refresh token. Drop the tokens
 *   and flag `RefreshTokenInvalid`; the client re-checks once, then logs out.
 *   Geins answers an expired refresh token with 403, not 401. In the jwt
 *   callback a 403 here is the second in a row: `refreshWithRetry` retries
 *   the first, since Geins can't yet tell a blip from a dead token.
 * - Anything else (5xx, 408, 429, network, timeout): keep the token, flag
 *   `RefreshFailed`, and let the next session fetch retry.
 */
export const tokenAfterRefreshError = <T extends Session>(
  token: T,
  error: unknown,
): Session => {
  if (isRefreshRejected(getErrorStatus(error))) {
    return { isAuthenticated: false, error: 'RefreshTokenInvalid' };
  }
  return { ...token, error: 'RefreshFailed' };
};

const REFRESH_RETRY_DELAY_MS = { min: 300, max: 800 };

/**
 * The pause before the refresh retry, jittered between 300 and 800 ms so
 * instances that hit the same Geins blip don't retry in lockstep.
 */
export const refreshRetryDelay = (random: () => number = Math.random): number =>
  REFRESH_RETRY_DELAY_MS.min +
  Math.round(
    random() * (REFRESH_RETRY_DELAY_MS.max - REFRESH_RETRY_DELAY_MS.min),
  );

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RefreshRetryOptions {
  /** Waits out the pause before the retry; tests pass one instead of timers. */
  wait?: (ms: number) => Promise<void>;
  /** Called before the retry with the status that caused it and the attempt. */
  onRetry?: (status: number, attempt: number) => void;
}

/**
 * Refreshes with `refreshToken`, and on a 403 refreshes once more with the
 * same token after a short pause. Resolves with the response, or rejects with
 * the last error for `tokenAfterRefreshError` to classify.
 *
 * Geins answers 403 both for a dead refresh token and when its own check of
 * the token fails (SQL or Key Vault), with nothing to tell them apart, so one
 * 403 may be a blip. A dead token stays dead, so the retry costs one request.
 * Reusing the token is safe: Geins refuses it only once a refresh with it has
 * finished. Nothing else is retried: other 4xx are final, and 5xx, network
 * errors and timeouts already keep the session.
 */
export const refreshWithRetry = async (
  refresh: (refreshToken?: string) => Promise<AuthResponse>,
  refreshToken: string | undefined,
  { wait = sleep, onRetry }: RefreshRetryOptions = {},
): Promise<AuthResponse> => {
  try {
    return await refresh(refreshToken);
  } catch (error) {
    if (!(error instanceof AuthApiError) || error.status !== 403) {
      throw error;
    }
    onRetry?.(error.status, 2);
    await wait(refreshRetryDelay());
    return refresh(refreshToken);
  }
};

/**
 * Builds the client session from the stored token. Pure — no network calls and
 * no throws — so `/api/auth/session` never wipes the cookie; a session without
 * a usable token comes back `isAuthenticated: false` and the client decides.
 */
export const sessionFromToken = (
  token: Session,
  expires: string,
): Session & { expires: string } => {
  if (token.isAuthenticated && token.accessToken) {
    return {
      expires,
      isAuthenticated: true,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      accountKey: token.accountKey,
      tokenExpires: token.tokenExpires,
      refreshedAt: token.refreshedAt,
      mfaActive: false,
      ...(token.error && { error: token.error }),
    };
  }
  if (token.mfaActive) {
    return {
      expires,
      isAuthenticated: false,
      mfaActive: true,
      mfaMethod: token.mfaMethod,
      loginToken: token.loginToken,
    };
  }
  return {
    expires,
    isAuthenticated: false,
    ...(token.error && { error: token.error }),
  };
};
