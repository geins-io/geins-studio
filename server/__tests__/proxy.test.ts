// @vitest-environment node
/* eslint-disable import/order, import/first */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { geinsAuth, logger } = vi.hoisted(() => ({
  geinsAuth: {
    refresh: vi.fn(),
    // Every token in these tests is due or expired.
    shouldRefresh: vi.fn(() => true),
  },
  logger: {
    geinsLog: vi.fn(),
    geinsLogInfo: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
  },
}));
vi.mock('nuxt/server', () => ({ deriveSecret: async () => 'a'.repeat(64) }));
vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({
    public: { apiUrl: 'https://geins.test', appId: 'studio' },
    private: { authSecret: '' },
  }),
}));
vi.mock('#shared/utils/log', () => ({ log: () => logger }));
vi.mock('../utils/auth', () => ({ auth: () => geinsAuth }));

import { createRouter, defineEventHandler, readBody } from 'h3';
import proxy from '../api/[...]';
import { SESSION_MAX_AGE_S } from '../utils/geins-session';
import { writeSealedSession, type GeinsSession } from '../utils/sealed-session';
import { createTestServer, fakeJwt, nowSeconds } from './session-test-utils';

const accessToken = (expiresIn: number) =>
  fakeJwt({ exp: nowSeconds() + expiresIn, 'geins:accountkey': ['account-1'] });

const signedIn = (token: string): GeinsSession => ({
  user: {},
  accountKey: 'account-1',
  tokenExpires: nowSeconds(),
  secure: { accessToken: token, refreshToken: 'refresh-1' },
});

const geinsAnswers = (status: number, headers: Record<string, string> = {}) =>
  geinsFetch.mockResolvedValue(
    new Response(JSON.stringify(status < 400 ? { items: [] } : {}), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    }),
  );

// The one call that reached Geins: its URL and Bearer token.
const sentToGeins = () => {
  expect(geinsFetch).toHaveBeenCalledOnce();
  const [url, init] = geinsFetch.mock.calls[0]!;
  return {
    url: String(url),
    authorization: new Headers(init.headers).get('authorization'),
  };
};

const seeded = async (session: GeinsSession) => {
  const router = createRouter().use('/api/**', proxy);
  const test = createTestServer({
    '/seed': defineEventHandler(async (event) => {
      await writeSealedSession(event, await readBody(event), SESSION_MAX_AGE_S);
      return { ok: true };
    }),
    '/': router.handler,
  });
  await test.request('/seed', { method: 'POST', body: session });
  return test;
};

// Both the JSON path (`$fetch`) and the stream path (`sendProxy`) end here.
const geinsFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('log', () => logger);
  vi.stubGlobal('fetch', geinsFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// The client refreshes under its Web Lock and retries a 401: a refresh here,
// on another instance, would race it and could leave a dead session behind.
describe('API proxy', () => {
  it.each([
    ['due', accessToken(60)],
    ['expired', accessToken(-60)],
  ])('sends a %s token as it is, without refreshing', async (_, token) => {
    geinsAnswers(200);
    const { request } = await seeded(signedIn(token));

    const response = await request('/api/product/list');

    expect(response.status).toBe(200);
    expect(sentToGeins()).toEqual({
      url: 'https://geins.test/product/list',
      authorization: `Bearer ${token}`,
    });
    expect(geinsAuth.refresh).not.toHaveBeenCalled();
    expect(response.setCookies).toEqual([]);
  });

  it("passes the API's 401 to an expired token on to the client", async () => {
    geinsAnswers(401);
    const { request } = await seeded(signedIn(accessToken(-60)));

    const response = await request('/api/product/list');

    expect(response.status).toBe(401);
    expect(geinsAuth.refresh).not.toHaveBeenCalled();
    expect(response.setCookies).toEqual([]);
  });

  it('streams with an expired token as it is, and drops the API cookies', async () => {
    const token = accessToken(-60);
    geinsAnswers(401, { 'set-cookie': 'ARRAffinity=abc; Path=/' });
    const { request } = await seeded(signedIn(token));

    const response = await request('/api/orchestrator/executions/e-1/stream');

    expect(response.status).toBe(401);
    expect(sentToGeins()).toEqual({
      url: 'https://geins.test/orchestrator/executions/e-1/stream',
      authorization: `Bearer ${token}`,
    });
    expect(geinsAuth.refresh).not.toHaveBeenCalled();
    expect(response.setCookies).toEqual([]);
  });
});
