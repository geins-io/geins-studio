import fetch from 'node-fetch';
import type { LoginCredentials, TFA } from '@/types/auth/Auth';

const AUTH_API_URL = process.env.AUTH_API_URL as string;
const ACCOUNT_KEY = process.env.ACCOUNT_KEY as string;

export const auth = () => {
  const login = async (credentials: LoginCredentials) => {
    const creds = {
      userName: credentials.username,
      password: credentials.password,
    };

    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ACCOUNT_KEY && { 'x-account-key': ACCOUNT_KEY }),
      },
      body: JSON.stringify(creds),
    });
    console.log('🚀 ~ login ~ response:', response);

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

  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    const url = `${AUTH_API_URL}/dfa-verify`;
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
    verify,
  };
};
