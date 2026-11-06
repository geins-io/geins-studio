import { jwtDecode } from 'jwt-decode';
import type {
  AuthTokens,
  LoginCredentials,
  AuthResponse,
  Session,
  ApiOptions,
} from '#shared/types';
import { buildQueryString } from '#shared/utils/api-query';
import { resolveAppId } from '#shared/utils/app';
import { AuthApiError } from '#shared/utils/auth-session';
import type { JWT } from 'next-auth/jwt';

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;
const APP_ID = resolveAppId(config.public.appId as string);
const { geinsLog } = log('server/utils/auth.ts');

const ENDPOINTS = {
  LOGIN: 'auth',
  REFRESH: 'auth/refresh',
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
// TODO: move some of these functions to shared folder (Nuxt 3.14)

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
   * Parses the provided token.
   *
   * @param {string | null} [token] - The token to parse.
   * @returns {JWT | null} - The parsed token data.
   */
  const parseToken = (token?: string | null): JWT | null => {
    return token ? jwtDecode<JWT>(token) : null;
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
   * Transform the login/verify/refresh response into a session object.
   *
   * @param {AuthResponse} response - The auth response.
   * @returns {Session} The token data including authorization status and expiration times.
   */
  const getSessionFromResponse = (response: AuthResponse): Session => {
    // User is not authenticated because MFA is required
    if (response.mfaRequired && response.loginToken) {
      return {
        isAuthenticated: false,
        mfaActive: true,
        mfaMethod: response.mfaMethod,
        loginToken: response.loginToken,
      };
    }

    // User is not authenticated because no access token was provided
    if (!response.mfaRequired && !response.accessToken) {
      return { isAuthenticated: false };
    }

    // User is authenticated, set up session
    const session: Session = getAuthenticatedSession(response);

    // If account is already selected or set, return session
    if (session.accountKey) {
      return session;
    }

    // Handle auto-selecting account if only one is available
    if (response.accounts) {
      session.accountKey =
        response.accounts.length === 1
          ? response.accounts[0]?.accountKey
          : undefined;
      return session;
    } else {
      throw new Error('No account key found for user');
    }
  };

  /**
   * Creates a session object that is authenticated.
   *
   * @param {Session} session - The session object to authenticate.
   * @returns {Session} The authenticated session object.
   */
  const getAuthenticatedSession = (session: Session): Session => {
    const parsedToken = parseToken(session.accessToken);

    const authenticatedSession: Session = {
      isAuthenticated: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accountKey: session.accountKey,
      tokenExpires: Number(parsedToken?.exp),
      refreshedAt: Number(parsedToken?.iat),
      mfaActive: false,
    };

    return authenticatedSession;
  };

  /**
   * Parses a session object that contains JSON strings as values.
   *
   * @param {Session} payload - The session object to parse.
   * @returns {Session} The parsed session object.
   */
  const parseSessionObjectStrings = (payload: Session): Session => {
    const session: Session = {};
    Object.entries(payload).forEach(([key, value]) => {
      try {
        session[key as keyof Session] = JSON.parse(value as string);
      } catch {
        session[key as keyof Session] = value;
      }
    });
    return session;
  };

  /**
   * Determines if the token should be refreshed.
   *
   * @param {Session} session - The session token.
   * @returns {boolean} True if the token should be refreshed, false otherwise.
   */
  const shouldRefresh = (session: Session): boolean => {
    return !!(
      session.isAuthenticated &&
      (isExpired(session.tokenExpires) || expiresSoon(session.tokenExpires))
    );
  };

  return {
    login,
    refresh,
    verify,
    parseToken,
    isExpired,
    expiresSoon,
    getSessionFromResponse,
    getAuthenticatedSession,
    parseSessionObjectStrings,
    shouldRefresh,
  };
};
