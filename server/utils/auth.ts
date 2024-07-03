// import fetch
import fetch from 'node-fetch';
// get api url from nuxt config
// const apiUrl2 = process.env.AUTH_ORIGIN;
// console.log('apiUrl', apiUrl2);

export const auth = () => {
  const apiUrl = 'https://geins-api-mgmt-service.azure-api.net/auth';
  // login
  const login = async (username: string, password: string) => {
    const credentials = {
      email: username,
      password,
    };

    const url = `${apiUrl}/auth`;
    console.log('url', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'geins',
        'x-session-id': 'geins',
      },
      body: JSON.stringify(credentials),
    });
    // console.log('[auth.ts] - login() --> response', response);
    if (response.ok) {
      const json = await response.json();
      console.log('[auth.ts] - login() --> response.json', json);
      return json;
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
    console.log('[auth.ts] - verify() --> param:credentials', credentials);
    const url = `${apiUrl}/dfa-verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    console.log('[auth.ts] - verify() --> response.ok', response.ok);
    console.log('[auth.ts] - verify() --> response.ok', response.status);

    if (response.ok) {
      return await response.json();
    }

    const text = await response.text();
    console.log('[auth.ts] - verify() --> response.text', text);
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
