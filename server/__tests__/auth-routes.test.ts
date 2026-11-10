// @vitest-environment node
/* eslint-disable import/order, import/first */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { geinsAuth } = vi.hoisted(() => ({
  geinsAuth: {
    login: vi.fn(),
    verify: vi.fn(),
    refresh: vi.fn(),
    shouldRefresh: () => false,
  },
}));
vi.mock('nuxt/server', () => ({ deriveSecret: async () => 'a'.repeat(64) }));
vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({ private: { authSecret: '' } }),
}));
vi.mock('#shared/utils/log', () => ({
  log: () => ({
    geinsLog: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
  }),
}));
vi.mock('../utils/auth', () => ({ auth: () => geinsAuth }));

import { AuthApiError } from '#shared/utils/auth-session';
import account from '../api/auth/account.post';
import login from '../api/auth/login.post';
import logout from '../api/auth/logout.post';
import session from '../api/auth/session.get';
import verify from '../api/auth/verify.post';
import { createTestServer, fakeJwt, nowSeconds } from './session-test-utils';

const token = (accounts: string[]) =>
  fakeJwt({ exp: nowSeconds() + 3600, 'geins:accountkey': accounts });

const server = () =>
  createTestServer({
    '/api/auth/login': login,
    '/api/auth/verify': verify,
    '/api/auth/account': account,
    '/api/auth/logout': logout,
    '/api/auth/session': session,
  });

const tokens = (accounts: string[]) => ({
  accessToken: token(accounts),
  refreshToken: 'refresh-1',
  accounts: accounts.map((accountKey) => ({
    accountKey,
    name: accountKey,
    roles: [],
  })),
});

const credentials = { username: 'user@example.com', password: 'secret' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('signs in and picks the only account', async () => {
    geinsAuth.login.mockResolvedValue(tokens(['account-1']));
    const { request } = server();
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    expect(response.body).toEqual({
      mfaRequired: false,
      accountRequired: false,
    });
    const client = (await request('/api/auth/session')).body;
    expect(client).toMatchObject({
      isAuthenticated: true,
      accountKey: 'account-1',
    });
    expect(JSON.stringify(client)).not.toContain('refresh-1');
  });

  it('asks for an account when there are several', async () => {
    geinsAuth.login.mockResolvedValue(tokens(['account-1', 'account-2']));
    const { request } = server();
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    expect(response.body.accountRequired).toBe(true);
  });

  it.each([
    [401, 401],
    [403, 401],
    [429, 429],
    [500, 502],
    [0, 502],
  ])('answers a Geins %i with %i, and stores nothing', async (geins, ours) => {
    geinsAuth.login.mockRejectedValue(new AuthApiError(geins, 'failed'));
    const { request, jar } = server();
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    expect(response.status).toBe(ours);
    expect(jar.size).toBe(0);
  });

  it('answers 400 without credentials', async () => {
    const { request } = server();
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'user@example.com' },
    });
    expect(response.status).toBe(400);
    expect(geinsAuth.login).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/verify', () => {
  const challenged = async () => {
    geinsAuth.login.mockResolvedValue({
      mfaRequired: true,
      mfaMethod: 'email',
      loginToken: 'login-1',
    });
    const test = server();
    const response = await test.request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    return { ...test, response };
  };

  it('keeps the login token on the server during MFA', async () => {
    const { response, request } = await challenged();
    expect(response.body).toEqual({
      mfaRequired: true,
      mfaMethod: 'email',
      accountRequired: false,
    });
    const client = (await request('/api/auth/session')).body;
    expect(client).toMatchObject({
      isAuthenticated: false,
      mfaActive: true,
      mfaMethod: 'email',
    });
    expect(JSON.stringify(client)).not.toContain('login-1');
  });

  it('sends the stored login token with the code, never one from the body', async () => {
    const { request } = await challenged();
    geinsAuth.verify.mockResolvedValue(tokens(['account-1']));
    const response = await request('/api/auth/verify', {
      method: 'POST',
      body: { mfaCode: '123456', loginToken: 'forged' },
    });
    expect(geinsAuth.verify).toHaveBeenCalledWith({
      loginToken: 'login-1',
      mfaCode: '123456',
    });
    expect(response.body.accountRequired).toBe(false);
    expect((await request('/api/auth/session')).body.isAuthenticated).toBe(
      true,
    );
  });

  it('keeps the MFA step after a wrong code', async () => {
    const { request } = await challenged();
    geinsAuth.verify.mockRejectedValue(new AuthApiError(400, 'Wrong code'));
    const response = await request('/api/auth/verify', {
      method: 'POST',
      body: { mfaCode: '000000' },
    });
    expect(response.status).toBe(401);
    expect((await request('/api/auth/session')).body.mfaActive).toBe(true);
  });

  it('answers 401 without an MFA session', async () => {
    const { request } = server();
    const response = await request('/api/auth/verify', {
      method: 'POST',
      body: { mfaCode: '123456' },
    });
    expect(response.status).toBe(401);
    expect(geinsAuth.verify).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/account', () => {
  const signedIn = async (accounts: string[]) => {
    geinsAuth.login.mockResolvedValue(tokens(accounts));
    const test = server();
    await test.request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    return test;
  };

  it('stores an account the token allows', async () => {
    const { request } = await signedIn(['account-1', 'account-2']);
    const response = await request('/api/auth/account', {
      method: 'POST',
      body: { accountKey: 'account-2' },
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      isAuthenticated: true,
      accountKey: 'account-2',
    });
  });

  it('refuses an account the user is not a member of', async () => {
    const { request } = await signedIn(['account-1', 'account-2']);
    await request('/api/auth/account', {
      method: 'POST',
      body: { accountKey: 'account-1' },
    });
    const response = await request('/api/auth/account', {
      method: 'POST',
      body: { accountKey: 'account-9' },
    });
    expect(response.status).toBe(403);
    expect((await request('/api/auth/session')).body.accountKey).toBe(
      'account-1',
    );
  });

  it('allows a Super Admin any account', async () => {
    geinsAuth.login.mockResolvedValue({
      accessToken: fakeJwt({
        exp: nowSeconds() + 3600,
        'geins:role': ['Super Admin'],
      }),
      refreshToken: 'refresh-1',
    });
    const { request } = server();
    await request('/api/auth/login', { method: 'POST', body: credentials });
    const response = await request('/api/auth/account', {
      method: 'POST',
      body: { accountKey: 'any-account' },
    });
    expect(response.status).toBe(200);
  });

  it('answers 401 without a session', async () => {
    const { request } = server();
    const response = await request('/api/auth/account', {
      method: 'POST',
      body: { accountKey: 'account-1' },
    });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('drops the session', async () => {
    geinsAuth.login.mockResolvedValue(tokens(['account-1']));
    const { request, jar } = server();
    await request('/api/auth/login', { method: 'POST', body: credentials });
    const response = await request('/api/auth/logout', { method: 'POST' });
    expect(response.status).toBe(204);
    expect(jar.size).toBe(0);
    expect((await request('/api/auth/session')).body.isAuthenticated).toBe(
      false,
    );
  });
});
