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

/**
 * The token to keep after a failed refresh. Never throws: next-auth 4 wipes the
 * session cookie when the jwt callback throws, which logged users out on any
 * Geins hiccup.
 *
 * - 401/403: Geins rejected the refresh token. Drop the tokens and flag
 *   `RefreshTokenInvalid`; the client re-checks once, then logs out.
 * - Anything else (5xx, 404, 429, network, timeout): keep the token, flag
 *   `RefreshFailed`, and let the next session fetch retry.
 */
export const tokenAfterRefreshError = <T extends Session>(
  token: T,
  error: unknown,
): Session => {
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) {
    return { isAuthenticated: false, error: 'RefreshTokenInvalid' };
  }
  return { ...token, error: 'RefreshFailed' };
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
