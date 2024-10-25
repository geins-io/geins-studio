import type { LoginCredentials, TFA, User, Session } from '@/types/auth/Auth';

const API_BASE = process.env.API_BASE as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

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
      throw new Error('Unauthorized');
    } else if (response.status === 403) {
      throw new Error('Insufficient permissions');
    } else if (response.status === 404) {
      throw new Error('Resource not found');
    }
    throw new Error(text);
  };

  const login = async (credentials: LoginCredentials) => {
    const creds = {
      username: credentials.username,
      password: credentials.password,
    };
    return callAPI<Session>('auth', 'POST', creds);
  };

  const getUser = async (accessToken: string): Promise<User | undefined> => {
    return callAPI<User>('user/me', 'GET', undefined, accessToken);
  };

  const refresh = async (refreshToken?: string, accessToken?: string) => {
    if (!refreshToken || !accessToken) {
      return undefined;
    }
    return callAPI<Session>('refresh', 'POST', { refreshToken }, accessToken);
  };

  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    return callAPI<User>('dfa-verify', 'POST', credentials);
  };

  return {
    login,
    getUser,
    refresh,
    verify,
  };
};
