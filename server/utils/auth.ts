// import fetch
import fetch from 'node-fetch';
const AUTH_API_URL = process.env.AUTH_API_URL;

export const auth = () => {
  const apiUrl = AUTH_API_URL;

  // login
  const login = async (username: string, password: string) => {
    const credentials = {
      email: username,
      password,
    };

    const url = `${apiUrl}/auth`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'geins',
        'x-session-id': 'geins',
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

  // dfa verify
  const verify = async (user: string, token: string, code: string) => {
    const credentials = {
      user,
      token,
      code,
    };
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
