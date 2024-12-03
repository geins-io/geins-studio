import type { LoginCredentials, TFA, User, Session } from '@/types/auth/Auth';
import { jwtDecode } from 'jwt-decode';

const API_BASE = process.env.API_BASE as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

const ENDPOINTS = {
  LOGIN: 'auth',
  USER: 'user/me',
  REFRESH: 'auth/refresh',
  VERIFY: 'dfa-verify',
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
   * @returns {Promise<T>} - The response data.
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
    const response = await fetch(`${API_BASE}/${url}`, {
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
   * @returns {Promise<Session>} - The session data.
   */
  const login = async (credentials: LoginCredentials) => {
    const creds = {
      username: credentials.username,
      password: credentials.password,
    };
    return callAPI<Session>(ENDPOINTS.LOGIN, 'POST', creds);
  };

  /**
   * Retrieves the user data using the provided access token.
   *
   * @param {string} accessToken - The access token.
   * @returns {Promise<User | undefined>} - The user data or undefined if not found.
   */
  const getUser = async (accessToken: string): Promise<User | undefined> => {
    return callAPI<User>(ENDPOINTS.USER, 'GET', undefined, accessToken);
  };

  /**
   * Refreshes the session using the provided refresh token.
   *
   * @param {string} [refreshToken] - The refresh token.
   * @returns {Promise<Session | undefined>} - The new session data or undefined if no refresh token is provided.
   */
  const refresh = async (refreshToken?: string) => {
    if (!refreshToken) {
      return undefined;
    }
    return callAPI<Session>(ENDPOINTS.REFRESH, 'POST', { refreshToken });
  };
  /**
   * Verifies the two-factor authentication (TFA) credentials.
   *
   * @param {TFA} tfa - The TFA credentials.
   * @returns {Promise<User>} - The verified user data.
   * @throws Will throw an error if TFA credentials are missing.
   */
  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    return callAPI<User>(ENDPOINTS.VERIFY, 'POST', credentials);
  };
  /**
   * Parses the provided token.
   *
   * @param {string | null} [token] - The token to parse.
   * @returns {any} - The parsed token data.
   */
  const parseToken = (token?: string | null) => {
    return token ? jwtDecode(token) : null;
  };
  /**
   * Checks if the token is expired.
   *
   * @param {number} [exp] - The expiration time in seconds.
   * @returns {boolean} - True if the token is expired, false otherwise.
   */
  const isExpired = (exp?: number) => {
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
   * @param {number} [threshold=150000] - The threshold in milliseconds.
   * @returns {boolean} - True if the token is about to expire soon, false otherwise.
   */
  const expiresSoon = (exp?: number, threshold = 150000) => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() + threshold > exp;
  };
  /**
   * Extracts token data from the session.
   *
   * @param {Session} tokens - The session tokens.
   * @returns {Session} - The token data including authorization status and expiration times.
   */
  const getTokenData = (tokens: Session): Session => {
    if (!tokens?.accessToken) {
      return { isAuthorized: false };
    }
    const parsedToken = parseToken(tokens.accessToken);
    return {
      isAuthorized: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpires: parsedToken?.exp,
      refreshedAt: parsedToken?.iat,
    };
  };
  /**
   * Determines if the token should be refreshed.
   *
   * @param {Session} token - The session token.
   * @returns {boolean} - True if the token should be refreshed, false otherwise.
   */
  const shouldRefresh = (token: Session) => {
    return (
      token.isAuthorized &&
      (isExpired(token.tokenExpires) || expiresSoon(token.tokenExpires))
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
    getTokenData,
    shouldRefresh,
  };
};
