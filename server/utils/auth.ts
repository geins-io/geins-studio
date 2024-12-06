import type { JWT } from 'next-auth/jwt';
import type {
  LoginCredentials,
  AuthResponse,
  User,
  Session,
} from '@/types/auth/Auth';

import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.API_URL as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

const ENDPOINTS = {
  LOGIN: 'auth',
  USER: 'user/me',
  REFRESH: 'auth/refresh',
  VERIFY: 'auth/verify',
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
   * @throws Will throw an error if the response status is not ok.
   */
  const callAPI = async <T>(
    url: string,
    method: string,
    data?: object,
    token?: string,
  ): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-account-key': ACCOUNT_KEY,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    return callAPI<User>(ENDPOINTS.USER, 'GET', undefined, accessToken);
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
  const verify = async (
    credentials: LoginCredentials,
  ): Promise<AuthResponse> => {
    if (!credentials.loginToken || !credentials.mfaCode) {
      throw new Error('Missing MFA credentials');
    }

    return callAPI<AuthResponse>(ENDPOINTS.VERIFY, 'POST', credentials);
  };

  /**
   * Parses the provided token.
   *
   * @param {string | null} [token] - The token to parse.
   * @returns {JWT | null} The parsed token data.
   */
  const parseToken = (token?: string | null): JWT | null => {
    return token ? jwtDecode(token) : null;
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
   * @param {number} [threshold=150000] - The threshold in milliseconds, default is 150000 (2.5 minutes).
   * @returns {boolean} True if the token is about to expire soon, false otherwise.
   */
  const expiresSoon = (exp?: number, threshold: number = 150000): boolean => {
    // TODO: fix threshold value
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
  const getSession = (response: AuthResponse): Session => {
    if (response.mfaRequired && response.loginToken) {
      return {
        isAuthorized: false,
        mfaActive: true,
        mfaMethod: response.mfaMethod,
        loginToken: response.loginToken,
      };
    }
    if (!response.mfaRequired && !response.accessToken) {
      return { isAuthorized: false };
    }

    const parsedToken = parseToken(response.accessToken);
    return {
      isAuthorized: true,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenExpires: Number(parsedToken?.exp),
      refreshedAt: Number(parsedToken?.iat),
      mfaActive: false,
    };
  };

  /**
   * Determines if the token should be refreshed.
   *
   * @param {Session} session - The session token.
   * @returns {boolean} True if the token should be refreshed, false otherwise.
   */
  const shouldRefresh = (session: Session): boolean => {
    return !!(
      session.isAuthorized &&
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
    getSession,
    shouldRefresh,
  };
};
