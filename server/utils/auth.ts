import type { LoginCredentials, TFA, User, Session } from '@/types/auth/Auth';
import { jwtDecode } from 'jwt-decode';
import { ref } from 'vue';

const API_BASE = process.env.API_BASE as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

const ENDPOINTS = {
  LOGIN: 'auth',
  USER: 'user/me',
  REFRESH: 'auth/refresh',
  VERIFY: 'dfa-verify',
};

const latestRefresh = ref(0);

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
    console.log('🚀 ~ auth ~  `${API_BASE}/${url}`:', `${API_BASE}/${url}`);
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
      console.log('🚀 ~ status 401 ~ text:', text);
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
    console.log('🚀 ~ refreshing ~ refreshToken:', refreshToken);
    if (!refreshToken) {
      return undefined;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    latestRefresh.value = timestamp;
    await $fetch(`/cookie/set/auth-refresh/${timestamp}`);
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
    console.log('🚀 ~ isExpired:', Date.now() > exp);
    return Date.now() > exp;
  };

  const expiresSoon = (exp?: number, threshold = 150000) => {
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    console.log('🚀 ~ expiresSoon:', Date.now() + threshold > exp);
    return Date.now() + threshold > exp;
  };

  const wasRefreshedRecently = (refreshedAt?: number, threshold = 10000) => {
    if (!refreshedAt) {
      return false;
    }
    refreshedAt = refreshedAt * 1000;
    console.log(
      '🚀 ~ wasRefreshedRecently:',
      Date.now() - threshold < refreshedAt,
    );
    return Date.now() - threshold < refreshedAt;
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
    };
  };

  const shouldRefresh = (token: Session) => {
    return (
      token.isAuthorized &&
      (isExpired(token.tokenExpires) || expiresSoon(token.tokenExpires)) &&
      !wasRefreshedRecently(latestRefresh.value)
    );
  };

  return {
    latestRefresh,
    login,
    getUser,
    refresh,
    verify,
    parseToken,
    isExpired,
    expiresSoon,
    wasRefreshedRecently,
    getTokenData,
    shouldRefresh,
  };
};
