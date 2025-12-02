import { type JWT } from 'next-auth/jwt';
import type {
  AuthTokens,
  LoginCredentials,
  AuthResponse,
  User,
  Session,
  ApiOptions,
} from '#shared/types';

import { jwtDecode } from 'jwt-decode';
import { buildQueryString } from '#shared/utils/api-query';

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;
const { geinsLog } = log('server/utils/auth.ts');

const ENDPOINTS = {
  LOGIN: 'auth',
  USER: 'user/me',
  REFRESH: 'auth/refresh',
  VERIFY: 'auth/verify',
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
   * @throws Will throw an error if the response status is not ok.
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
    };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    if (options) {
      const queryString = buildQueryString(options);
      url += `${queryString}`;
    }
    const response = await fetch(`${API_URL}/${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (response.ok) {
      return response.json();
    }

    const text = await response.text();
    if (response.status === 401) {
      throw { status: response.status, message: 'Unauthorized' };
    } else if (response.status === 403) {
      throw { status: response.status, message: 'Insufficient permissions' };
    } else if (response.status === 404) {
      throw { status: response.status, message: 'Resource not found' };
    }
    throw new Error(text);
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
   * Retrieves the user data using the provided access token.
   *
   * @param {string} accessToken - The access token.
   * @returns {Promise<User | undefined>} The user data or undefined if not found.
   */
  const getUser = async (accessToken: string): Promise<User | undefined> => {
    return callAPI<User>(ENDPOINTS.USER, 'GET', undefined, accessToken, {
      fields: ['accounts'],
    });
  };

  /**
   * Refreshes the session using the provided refresh token.
   *
   * @param {string} [refreshToken] - The refresh token.
   * @returns {Promise<Session | undefined>} The new session data or undefined if no refresh token is provided.
   */
  const refresh = async (
    refreshToken?: string,
  ): Promise<AuthResponse | undefined> => {
    geinsLog('refreshing token:', refreshToken);
    if (!refreshToken) {
      return undefined;
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
          ? response.accounts[0].accountKey
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
      user: session.user,
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
    getUser,
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
