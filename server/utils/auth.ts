import type { LoginCredentials, TFA, User } from '@/types/auth/Auth';

const API_BASE = process.env.API_BASE as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

export const auth = () => {
  const login = async (credentials: LoginCredentials) => {
    const creds = {
      username: credentials.username,
      password: credentials.password,
    };

    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-key': ACCOUNT_KEY,
      },
      body: JSON.stringify(creds),
    });

    if (response.status === 200) {
      return await response.json();
    }

    const text = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid credentials');
    } else if (response.status === 403) {
      throw new Error('Insufficient permissions');
    } else if (response.status === 404) {
      throw new Error('Resource not found');
    }
    throw new Error(text);
  };

  const getUser = async (accessToken: string): Promise<User | undefined> => {
    const response = await fetch(`${API_BASE}/user/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-account-key': ACCOUNT_KEY,
      },
    });

    if (response.ok) {
      return await response.json();
    }
  };

  const refresh = async (refreshToken: string, accessToken: string) => {
    const response = await fetch(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-account-key': ACCOUNT_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      return await response.json();
    }
  };

  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    const url = `${API_BASE}/dfa-verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      return await response.json();
    }

    const text = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid credentials');
    } else if (response.status === 403) {
      throw new Error('Insufficient permissions');
    } else if (response.status === 404) {
      throw new Error('Resource not found');
    }
    throw new Error(text);
  };

  return {
    login,
    getUser,
    refresh,
    verify,
  };
};
