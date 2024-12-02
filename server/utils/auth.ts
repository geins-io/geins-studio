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

export const auth = () => {
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

  const login = async (credentials: LoginCredentials) => {
    const creds = {
      username: credentials.username,
      password: credentials.password,
    };
    return callAPI<Session>(ENDPOINTS.LOGIN, 'POST', creds);
  };

  const getUser = async (accessToken: string): Promise<User | undefined> => {
    return callAPI<User>(ENDPOINTS.USER, 'GET', undefined, accessToken);
  };

  const refresh = async (refreshToken?: string) => {
    if (!refreshToken) {
      return undefined;
    }
    return callAPI<Session>(ENDPOINTS.REFRESH, 'POST', { refreshToken });
  };

  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    return callAPI<User>(ENDPOINTS.VERIFY, 'POST', credentials);
  };

  const parseToken = (token?: string | null) => {
    return token ? jwtDecode(token) : null;
  };

  const isExpired = (exp?: number) => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() > exp;
  };

  const expiresSoon = (exp?: number, threshold = 150000) => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() + threshold > exp;
  };

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
