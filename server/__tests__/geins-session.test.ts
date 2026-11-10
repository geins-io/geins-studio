// @vitest-environment node
/* eslint-disable import/order, import/first */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const AUTH_SECRET = 'legacy-secret-for-tests-0123456789';
const { geinsAuth } = vi.hoisted(() => ({
  geinsAuth: {
    login: vi.fn(),
    verify: vi.fn(),
    refresh: vi.fn(),
    // As in server/utils/auth.ts: expired, or expiring within 5 minutes.
    shouldRefresh: (s: { isAuthenticated?: boolean; tokenExpires?: number }) =>
      !!s.isAuthenticated &&
      !!s.tokenExpires &&
      Date.now() + 300_000 > s.tokenExpires * 1000,
  },
}));
vi.mock('nuxt/server', () => ({ deriveSecret: async () => 'a'.repeat(64) }));
vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({ private: { authSecret: AUTH_SECRET } }),
}));
vi.mock('#shared/utils/log', () => ({
  log: () => ({
    geinsLog: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
  }),
}));
vi.mock('../utils/auth', () => ({ auth: () => geinsAuth }));

import { hkdfSync } from 'node:crypto';
import { defineEventHandler, readBody } from 'h3';
import { EncryptJWT } from 'jose';
import { AuthApiError } from '#shared/utils/auth-session';
import {
  SESSION_MAX_AGE_S,
  forceRefreshSession,
  readGeinsSession,
  toClientSession,
} from '../utils/geins-session';
import { tokenAllowsAccount } from '../utils/geins-token';
import { writeSealedSession, type GeinsSession } from '../utils/sealed-session';
import { createTestServer, fakeJwt, nowSeconds } from './session-test-utils';

const accessToken = (expiresIn: number, accounts: string[] = ['account-1']) =>
  fakeJwt({ exp: nowSeconds() + expiresIn, 'geins:accountkey': accounts });

const signedIn = (token: string, accountKey = 'account-1'): GeinsSession => ({
  user: {},
  accountKey,
  tokenExpires: JSON.parse(
    Buffer.from(token.split('.')[1]!, 'base64url').toString(),
  ).exp,
  secure: { accessToken: token, refreshToken: 'refresh-1' },
});

const server = () =>
  createTestServer({
    '/seed': defineEventHandler(async (event) => {
      await writeSealedSession(event, await readBody(event), SESSION_MAX_AGE_S);
      return { ok: true };
    }),
    // What the API proxy does: never downgrades.
    '/proxy': defineEventHandler(async (event) => {
      const session = await readGeinsSession(event);
      return {
        accessToken: session.secure?.accessToken,
        accountKey: session.accountKey,
      };
    }),
    '/session': defineEventHandler(async (event) =>
      toClientSession(await readGeinsSession(event, { mayDowngrade: true })),
    ),
    '/refresh': defineEventHandler(async (event) =>
      toClientSession(await forceRefreshSession(event, await readBody(event))),
    ),
  });

const seeded = async (session: GeinsSession) => {
  const test = server();
  await test.request('/seed', { method: 'POST', body: session });
  return test;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tokenAllowsAccount', () => {
  it('allows an account the token lists', () => {
    expect(tokenAllowsAccount(accessToken(60, ['a', 'b']), 'b')).toBe(true);
    expect(tokenAllowsAccount(fakeJwt({ 'geins:accountkey': 'a' }), 'a')).toBe(
      true,
    );
  });

  it('refuses an account the token does not list', () => {
    expect(tokenAllowsAccount(accessToken(60, ['a']), 'b')).toBe(false);
    expect(
      tokenAllowsAccount(fakeJwt({ 'geins:role': ['a:Admin'] }), 'a'),
    ).toBe(false);
  });

  it('allows a Super Admin any account', () => {
    expect(
      tokenAllowsAccount(fakeJwt({ 'geins:role': ['Super Admin'] }), 'any'),
    ).toBe(true);
    expect(
      tokenAllowsAccount(fakeJwt({ 'geins:role': 'Super Admin' }), 'any'),
    ).toBe(true);
  });

  it('refuses a token it cannot decode, or an empty key', () => {
    expect(tokenAllowsAccount('not-a-jwt', 'a')).toBe(false);
    expect(tokenAllowsAccount(accessToken(60, ['']), '')).toBe(false);
  });
});

describe('toClientSession', () => {
  it('never carries a token', () => {
    const client = toClientSession({
      ...signedIn(accessToken(3600)),
      mfa: { method: 'email' },
      secure: { accessToken: 'a', refreshToken: 'r', loginToken: 'l' },
    });
    expect(JSON.stringify(client)).not.toMatch(/"(a|r|l)"/);
    expect(Object.keys(client).sort()).toEqual(
      [
        'accountKey',
        'isAuthenticated',
        'mfaActive',
        'mfaMethod',
        'tokenExpires',
      ].sort(),
    );
  });

  it('is unauthenticated mid-MFA and after RefreshTokenInvalid', () => {
    expect(toClientSession({ mfa: { method: 'sms' } })).toMatchObject({
      isAuthenticated: false,
      mfaActive: true,
      mfaMethod: 'sms',
    });
    expect(toClientSession({ error: 'RefreshTokenInvalid' })).toMatchObject({
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    });
  });
});

describe('readGeinsSession', () => {
  it("doesn't refresh a token that isn't due", async () => {
    const { request } = await seeded(signedIn(accessToken(3600)));
    await request('/proxy');
    expect(geinsAuth.refresh).not.toHaveBeenCalled();
  });

  it('refreshes once for parallel calls in one instance', async () => {
    const fresh = accessToken(3600);
    let resolve!: (value: unknown) => void;
    geinsAuth.refresh.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { request } = await seeded(signedIn(accessToken(60)));
    const calls = Array.from({ length: 8 }, () => request('/proxy'));
    await new Promise((r) => setTimeout(r, 10));
    resolve({ accessToken: fresh, refreshToken: 'refresh-2' });
    const responses = await Promise.all(calls);

    expect(geinsAuth.refresh).toHaveBeenCalledTimes(1);
    expect(geinsAuth.refresh).toHaveBeenCalledWith('refresh-1');
    for (const response of responses) {
      expect(response.body.accessToken).toBe(fresh);
      expect(
        response.setCookies.some((c) => c.startsWith('geins-session.0')),
      ).toBe(true);
    }
  });

  it('keeps the account the new token still allows', async () => {
    geinsAuth.refresh.mockResolvedValue({ accessToken: accessToken(3600) });
    const { request } = await seeded(signedIn(accessToken(60)));
    expect((await request('/proxy')).body.accountKey).toBe('account-1');
  });

  it('drops an account the refreshed token no longer allows', async () => {
    geinsAuth.refresh.mockResolvedValue({
      accessToken: accessToken(3600, ['account-2']),
      refreshToken: 'refresh-2',
    });
    const { request } = await seeded(signedIn(accessToken(60)));
    expect((await request('/proxy')).body.accountKey).toBeUndefined();
    const { body } = await request('/session');
    expect(body.isAuthenticated).toBe(true);
    expect(body.accountKey).toBeUndefined();
  });

  describe('when the refresh fails', () => {
    it('never writes the failure from the proxy', async () => {
      geinsAuth.refresh.mockRejectedValue(new AuthApiError(401, 'Rejected'));
      const due = accessToken(60);
      const { request } = await seeded(signedIn(due));
      const response = await request('/proxy');
      expect(response.body.accessToken).toBe(due);
      expect(response.setCookies).toEqual([]);
    });

    it('writes RefreshTokenInvalid from the session route and drops the tokens', async () => {
      geinsAuth.refresh.mockRejectedValue(new AuthApiError(401, 'Rejected'));
      const { request } = await seeded(signedIn(accessToken(60)));
      expect((await request('/session')).body).toEqual({
        isAuthenticated: false,
        mfaActive: false,
        error: 'RefreshTokenInvalid',
      });
      geinsAuth.refresh.mockClear();
      const after = await request('/proxy');
      expect(after.body.accessToken).toBeUndefined();
      expect(geinsAuth.refresh).not.toHaveBeenCalled();
    });

    it('keeps the tokens on a transient failure', async () => {
      geinsAuth.refresh.mockRejectedValue(new AuthApiError(503, 'Down'));
      const due = accessToken(60);
      const { request } = await seeded(signedIn(due));
      expect((await request('/session')).body).toMatchObject({
        isAuthenticated: true,
        error: 'RefreshFailed',
      });
      expect((await request('/proxy')).body.accessToken).toBe(due);
    });
  });
});

describe('forceRefreshSession', () => {
  it('refreshes the rejected token even before it is due', async () => {
    const current = signedIn(accessToken(3600));
    const fresh = accessToken(3500);
    geinsAuth.refresh.mockResolvedValue({ accessToken: fresh });
    const { request } = await seeded(current);
    const response = await request('/refresh', {
      method: 'POST',
      body: { rejectedTokenExpires: current.tokenExpires },
    });
    expect(geinsAuth.refresh).toHaveBeenCalledTimes(1);
    expect(response.body.tokenExpires).not.toBe(current.tokenExpires);
  });

  it("doesn't refresh a token another tab already rotated", async () => {
    const current = signedIn(accessToken(3600));
    const { request } = await seeded(current);
    const response = await request('/refresh', {
      method: 'POST',
      body: { rejectedTokenExpires: current.tokenExpires! - 100 },
    });
    expect(geinsAuth.refresh).not.toHaveBeenCalled();
    expect(response.body.tokenExpires).toBe(current.tokenExpires);
  });
});

describe('next-auth session migration', () => {
  const encryptLegacy = (payload: object, secret = AUTH_SECRET) =>
    new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .encrypt(
        new Uint8Array(
          hkdfSync(
            'sha256',
            secret,
            '',
            'NextAuth.js Generated Encryption Key',
            32,
          ),
        ),
      );

  // The token the old jwt callback stored (getSessionFromResponse).
  const legacyPayload = (token: string, accountKey = 'account-1') => ({
    isAuthenticated: true,
    accessToken: token,
    refreshToken: 'refresh-1',
    accountKey,
    tokenExpires: 0,
    refreshedAt: 0,
    mfaActive: false,
  });

  const migrate = async (cookies: Record<string, string>) => {
    const test = server();
    const response = await test.request('/session', { cookies });
    return { ...test, response };
  };

  it('moves a next-auth session into the sealed session', async () => {
    const token = accessToken(3600);
    const { response, jar, request } = await migrate({
      '__Secure-next-auth.session-token': await encryptLegacy(
        legacyPayload(token),
      ),
      '__Host-next-auth.csrf-token': 'csrf',
      'unrelated-cookie': 'keep',
    });

    expect(response.body).toMatchObject({
      isAuthenticated: true,
      accountKey: 'account-1',
    });
    expect([...jar.keys()]).toEqual(['geins-session.0']);
    const deleted = response.setCookies.filter((c) => /Max-Age=0/i.test(c));
    expect(deleted.map((c) => c.split('=')[0]).sort()).toEqual([
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.session-token',
    ]);
    expect(deleted.every((c) => /Secure/i.test(c))).toBe(true);
    expect((await request('/proxy')).body.accessToken).toBe(token);
  });

  it('joins a chunked cookie, and reads the http name', async () => {
    const sealed = await encryptLegacy(legacyPayload(accessToken(3600)));
    const half = Math.ceil(sealed.length / 2);
    const { response, jar } = await migrate({
      'next-auth.session-token.1': sealed.slice(half),
      'next-auth.session-token.0': sealed.slice(0, half),
    });
    expect(response.body.isAuthenticated).toBe(true);
    expect([...jar.keys()]).toEqual(['geins-session.0']);
  });

  it('refreshes a migrated token that is due', async () => {
    geinsAuth.refresh.mockResolvedValue({ accessToken: accessToken(3600) });
    const { response } = await migrate({
      '__Secure-next-auth.session-token': await encryptLegacy(
        legacyPayload(accessToken(-60)),
      ),
    });
    expect(geinsAuth.refresh).toHaveBeenCalledWith('refresh-1');
    expect(response.body.isAuthenticated).toBe(true);
  });

  it('drops an account the token does not allow', async () => {
    const { response } = await migrate({
      '__Secure-next-auth.session-token': await encryptLegacy(
        legacyPayload(accessToken(3600, ['account-1']), 'account-9'),
      ),
    });
    expect(response.body.isAuthenticated).toBe(true);
    expect(response.body.accountKey).toBeUndefined();
  });

  it.each([
    [
      'tampered',
      async () => `${await encryptLegacy(legacyPayload(accessToken(3600)))}x`,
    ],
    [
      'encrypted with another secret',
      () => encryptLegacy(legacyPayload(accessToken(3600)), 'another-secret'),
    ],
    [
      'signed out',
      () =>
        encryptLegacy({ isAuthenticated: false, error: 'RefreshTokenInvalid' }),
    ],
  ])('reads a %s cookie as empty, and deletes it', async (_, cookie) => {
    const { response, jar } = await migrate({
      '__Secure-next-auth.session-token': await cookie(),
    });
    expect(response.body).toMatchObject({ isAuthenticated: false });
    expect([...jar.keys()]).toEqual([]);
  });

  it('ignores next-auth cookies once a sealed session exists', async () => {
    const token = accessToken(3600);
    const { request } = await seeded(signedIn(token));
    const response = await request('/proxy', {
      cookies: {
        ...Object.fromEntries((await seeded(signedIn(token))).jar),
        '__Secure-next-auth.session-token': await encryptLegacy(
          legacyPayload(accessToken(3600, ['account-2']), 'account-2'),
        ),
      },
    });
    expect(response.body.accountKey).toBe('account-1');
  });
});
