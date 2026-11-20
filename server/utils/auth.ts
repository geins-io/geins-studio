import { useRuntimeConfig } from 'nitropack/runtime';
import type {
  AuthTokens,
  LoginCredentials,
  AuthResponse,
  TokenSession,
  ApiOptions,
} from '#shared/types';
import { buildQueryString } from '#shared/utils/api-query';
import { resolveAppId } from '#shared/utils/app';
import { AuthApiError } from '#shared/utils/auth-session';
import { log } from '#shared/utils/log';

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;
const APP_ID = resolveAppId(config.public.appId as string);
const { geinsLog } = log('server/utils/auth.ts');

const ENDPOINTS = {
  LOGIN: 'auth',
  REFRESH: 'auth/refresh',
  REVOKE: 'auth/revoke',
  VERIFY: 'auth/verify',
};
// A hung refresh must fail as a retryable network error, not run into the
// function timeout.
const REQUEST_TIMEOUT_MS = 10_000;
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Unauthorized',
  403: 'Insufficient permissions',
  404: 'Resource not found',
};

/**
 * Utility functions for authentication.
 */
export const auth = () => {
  /**
   * Calls the API with the specified parameters.
   *
   * @template T - The expected response type.
   * @param {string} url - The endpoint URL.
   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
   * @param {object} [data] - The request payload.
   * @param {string} [token] - The authorization token.
   * @returns {Promise<T>} The response data.
   * @throws {AuthApiError} With the HTTP status for a non-OK response, or status `0` for a network failure or timeout.
   */
  const callAPI = async <T>(
    url: string,
    method: string,
    data?: object,
    token?: string,
    options?: ApiOptions<string>,
  ): Promise<T> => {
    const headers: HeadersInit = {
      'content-type': 'application/json',
      'x-app': APP_ID,
    };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    if (options) {
      const queryString = buildQueryString(options);
      url += `${queryString}`;
    }
    let response: Response;
    try {
      response = await fetch(`${API_URL}/${url}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new AuthApiError(0, `Request to ${url} failed`, { cause: error });
    }

    if (response.status === 204) {
      return undefined as T;
    }
    if (response.ok) {
      return response.json();
    }

    throw new AuthApiError(
      response.status,
      STATUS_MESSAGES[response.status] ??
        `Request to ${url} failed with ${response.status}`,
    );
  };

  /**
   * Logs in a user with the provided credentials.
   *
   * @param {LoginCredentials} credentials - The user's login credentials.
   * @returns {Promise<AuthResponse>} The session data.
   */
  const login = async (
    credentials: LoginCredentials,
  ): Promise<AuthResponse> => {
    const creds = {
      username: credentials.username,
      password: credentials.password,
    };
    return callAPI<AuthResponse>(ENDPOINTS.LOGIN, 'POST', creds);
  };

  /**
   * Refreshes the session using the provided refresh token.
   *
   * @param {string} [refreshToken] - The refresh token.
   * @returns {Promise<AuthResponse>} The new tokens.
   * @throws {AuthApiError} 401 when there is no refresh token, else as `callAPI`.
   */
  const refresh = async (refreshToken?: string): Promise<AuthResponse> => {
    geinsLog('refreshing token');
    if (!refreshToken) {
      throw new AuthApiError(401, 'Missing refresh token');
    }
    return callAPI<AuthResponse>(ENDPOINTS.REFRESH, 'POST', { refreshToken });
  };

  /**
   * Revokes a refresh token, so it can't be refreshed again. Geins answers
   * `204` whether the token was valid, unknown, revoked or expired. Access
   * tokens it already issued stay valid until their `exp`.
   *
   * @param {string} refreshToken - The session's latest refresh token: revoking one that was already exchanged doesn't touch the token it was exchanged for.
   * @throws {AuthApiError} As `callAPI`: `400` for a blank token, `503` when Geins couldn't revoke it, `404` where the endpoint isn't deployed.
   */
  const revoke = async (refreshToken: string): Promise<void> => {
    await callAPI<undefined>(ENDPOINTS.REVOKE, 'POST', { refreshToken });
  };

  /**
   * Verifies the two-factor authentication (MFA) credentials.
   *
   * @param {LoginCredentials} credentials - The MFA login credentials.
   * @returns {Promise<AuthResponse>} The verified user auth response.
   * @throws Will throw an error if `loginToken` or `mfaCode` is missing from `credentials`.
   */
  const verify = async (tokens: AuthTokens): Promise<AuthResponse> => {
    if (!tokens.loginToken || !tokens.mfaCode) {
      throw new Error('Missing MFA credentials');
    }

    return callAPI<AuthResponse>(ENDPOINTS.VERIFY, 'POST', tokens);
  };

  /**
   * Checks if the token is expired.
   *
   * @param {number} [exp] - The expiration time in seconds.
   * @returns {boolean} True if the token is expired, false otherwise.
   */
  const isExpired = (exp?: number): boolean => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() > exp;
  };

  /**
   * Checks if the token is about to expire soon.
   *
   * @param {number} [exp] - The expiration time in seconds.
   * @param {number} [threshold=300000] - The threshold in milliseconds, default is 300000 (5 minutes).
   * @returns {boolean} True if the token is about to expire soon, false otherwise.
   */
  const expiresSoon = (exp?: number, threshold: number = 300000): boolean => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() + threshold > exp;
  };

  /**
   * Determines if the token should be refreshed.
   *
   * @param {TokenSession} session - The session token.
   * @returns {boolean} True if the token should be refreshed, false otherwise.
   */
  const shouldRefresh = (session: TokenSession): boolean => {
    return !!(
      session.isAuthenticated &&
      (isExpired(session.tokenExpires) || expiresSoon(session.tokenExpires))
    );
  };

  return {
    login,
    refresh,
    revoke,
    verify,
    isExpired,
    expiresSoon,
    shouldRefresh,
  };
};
