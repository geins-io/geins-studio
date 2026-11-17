import { jwtDecode } from 'jwt-decode';
import type {
  AuthResponse,
  ForceRefreshRequest,
  TokenSession,
} from '#shared/types';

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
  token: TokenSession,
  response: AuthResponse,
): TokenSession => {
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
 * The token to keep after a failed refresh. Never throws: a throw while reading
 * the session must never turn a Geins hiccup into a logout.
 *
 * - Any 4xx but 408 and 429: Geins rejected the refresh token. Drop the tokens
 *   and flag `RefreshTokenInvalid`; the client re-checks once, then logs out.
 *   Geins answers a dead refresh token (expired, revoked, or already redeemed
 *   by a concurrent refresh) with 403, not 401, and a failed check on its own
 *   side with 503, so a 403 is final and never retried.
 * - Anything else (5xx, 408, 429, network, timeout): keep the token, flag
 *   `RefreshFailed`, and let the next session fetch retry.
 */
export const tokenAfterRefreshError = <T extends TokenSession>(
  token: T,
  error: unknown,
): TokenSession => {
  if (isRefreshRejected(getErrorStatus(error))) {
    return { isAuthenticated: false, error: 'RefreshTokenInvalid' };
  }
  return { ...token, error: 'RefreshFailed' };
};

const isForceRefreshRequest = (body: unknown): body is ForceRefreshRequest =>
  !!body &&
  typeof body === 'object' &&
  'rejectedTokenExpires' in body &&
  typeof body.rejectedTokenExpires === 'number';

/**
 * Whether a forced refresh of `token` should run now. The client asks for one
 * after the API answered 401 to a token that hasn't expired, which a plain
 * session read wouldn't refresh. Only while the stored token is still the
 * rejected one (the client knows it by its `tokenExpires`): if another tab
 * already rotated it, refreshing again would revoke that tab's new token.
 */
export const shouldForceRefresh = (
  token: TokenSession,
  request: unknown,
): boolean =>
  isForceRefreshRequest(request) &&
  !!token.isAuthenticated &&
  !!token.accessToken &&
  request.rejectedTokenExpires === token.tokenExpires;
