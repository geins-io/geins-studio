// import fetch
import fetch from 'node-fetch';
import type { LoginCredentials, TFA } from '@/types/auth/Auth';

const AUTH_API_URL = process.env.AUTH_API_URL;

export const auth = () => {
  const apiUrl = AUTH_API_URL;

  const login = async (credentials: LoginCredentials) => {
    const creds = {
      email: credentials.username,
      password: credentials.password,
    };

    const url = `${apiUrl}/auth`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'geins',
        'x-session-id': 'geins',
      },
      body: JSON.stringify(creds),
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

  const verify = async (tfa: TFA) => {
    if (!tfa || !tfa.code || !tfa.username || !tfa.token) {
      throw new Error('Missing TFA credentials');
    }

    const { username, token, code } = tfa;
    const credentials = { user: username, token, code };

    const url = `${apiUrl}/dfa-verify`;
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
