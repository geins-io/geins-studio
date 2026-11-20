// @vitest-environment node
/* eslint-disable import/order, import/first */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const secret = vi.hoisted(() => ({ value: 'a'.repeat(64) }));
vi.mock('nuxt/server', () => ({ deriveSecret: async () => secret.value }));
vi.mock('#shared/utils/log', () => ({
  log: () => ({
    geinsLog: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
  }),
}));

import { defineEventHandler } from 'h3';
import {
  CHUNK_SIZE,
  MAX_CHUNKS,
  chunkSpan,
  clearSealedSession,
  readSealedSession,
  sessionChunks,
  splitIntoChunks,
  writeSealedSession,
  type GeinsSession,
} from '../utils/sealed-session';
import { createTestServer } from './session-test-utils';

const session: GeinsSession = {
  user: {},
  accountKey: 'account-1',
  tokenExpires: 2000,
  secure: { accessToken: 'access-1', refreshToken: 'refresh-1' },
};

const server = (toWrite: GeinsSession[] = [session]) =>
  createTestServer({
    '/write': defineEventHandler(async (event) => {
      for (const value of toWrite) {
        await writeSealedSession(event, value, 60);
      }
      return { ok: true };
    }),
    '/read': defineEventHandler((event) => readSealedSession(event)),
    '/clear': defineEventHandler((event) => {
      clearSealedSession(event);
      return { ok: true };
    }),
  });

const chunkNames = (jar: Map<string, string>) =>
  [...jar.keys()].filter((name) => name.startsWith('geins-session.')).sort();

beforeEach(() => {
  secret.value = 'a'.repeat(64);
});

describe('sealed session', () => {
  it('reads back what it wrote', async () => {
    const { request, jar } = server();
    await request('/write', { method: 'POST' });
    expect(chunkNames(jar)).toEqual(['geins-session.0']);
    expect((await request('/read')).body).toEqual(session);
  });

  it('writes httpOnly, SameSite=Lax cookies for the whole site', async () => {
    const { request } = server();
    const { setCookies } = await request('/write', { method: 'POST' });
    expect(setCookies[0]).toMatch(/HttpOnly/i);
    expect(setCookies[0]).toMatch(/SameSite=Lax/i);
    expect(setCookies[0]).toMatch(/Path=\//i);
    expect(setCookies[0]).toMatch(/Max-Age=60/i);
  });

  it('splits a large session over several cookies and joins them back', async () => {
    const big = { ...session, secure: { accessToken: 'x'.repeat(6000) } };
    const { request, jar } = server([big]);
    await request('/write', { method: 'POST' });
    expect(chunkNames(jar)).toEqual([
      'geins-session.0',
      'geins-session.1',
      'geins-session.2',
    ]);
    for (const name of chunkNames(jar)) {
      expect(jar.get(name)!.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
    expect((await request('/read')).body).toEqual(big);
  });

  it('deletes leftover higher chunks', async () => {
    const big = { ...session, secure: { accessToken: 'x'.repeat(6000) } };
    const { request, jar } = server([big]);
    await request('/write', { method: 'POST' });
    const small = createTestServer({
      '/write': defineEventHandler(async (event) => {
        await writeSealedSession(event, session, 60);
        return { ok: true };
      }),
    });
    const { setCookies } = await small.request('/write', {
      method: 'POST',
      cookies: Object.fromEntries(jar),
    });
    const deleted = setCookies
      .filter((line) => /Max-Age=0/i.test(line))
      .map((line) => line.split('=')[0]);
    expect(deleted).toEqual(['geins-session.1', 'geins-session.2']);
  });

  it('deletes the chunks an earlier write in the same response set', async () => {
    const big = { ...session, secure: { accessToken: 'x'.repeat(6000) } };
    const { request, jar } = server([big, session]);
    await request('/write', { method: 'POST' });
    expect(chunkNames(jar)).toEqual(['geins-session.0']);
    expect((await request('/read')).body).toEqual(session);
  });

  it('reads a tampered session as empty', async () => {
    const { request, jar } = server();
    await request('/write', { method: 'POST' });
    const sealed = jar.get('geins-session.0')!;
    jar.set('geins-session.0', `${sealed.slice(0, -4)}AAAA`);
    expect((await request('/read')).body).toEqual({});
  });

  it('reads a session sealed with another secret as empty', async () => {
    const { request } = server();
    await request('/write', { method: 'POST' });
    secret.value = 'b'.repeat(64);
    expect((await request('/read')).body).toEqual({});
  });

  it(`refuses a session over ${MAX_CHUNKS} chunks, and writes nothing`, async () => {
    const huge = {
      ...session,
      secure: { accessToken: 'x'.repeat(CHUNK_SIZE * MAX_CHUNKS) },
    };
    const { request, jar } = server([huge]);
    const response = await request('/write', { method: 'POST' });
    expect(response.status).toBe(500);
    expect(chunkNames(jar)).toEqual([]);
  });

  it('clears every chunk', async () => {
    const big = { ...session, secure: { accessToken: 'x'.repeat(6000) } };
    const { request, jar } = server([big]);
    await request('/write', { method: 'POST' });
    await request('/clear', { method: 'POST' });
    expect(chunkNames(jar)).toEqual([]);
    expect((await request('/read')).body).toEqual({});
  });
});

describe('chunk helpers', () => {
  // Node answers 431 to request headers over 16 KB, before any handler runs:
  // a full session must leave room for the other cookies and headers.
  it('keeps a full session well under the 16 KB header limit', () => {
    const cookieHeader =
      MAX_CHUNKS * (CHUNK_SIZE + 'geins-session.0=; '.length);
    expect(cookieHeader).toBeLessThanOrEqual(12 * 1024);
  });

  it('joins chunks in index order, whatever order the cookies come in', () => {
    const cookies = {
      'geins-session.10': 'k',
      'geins-session.2': 'c',
      other: 'x',
      'geins-session.0': 'a',
      'geins-session.1': 'b',
      'geins-session.x': 'y',
    };
    expect(sessionChunks(cookies).join('')).toBe('abck');
    expect(chunkSpan(cookies)).toBe(11);
  });

  it('splits into chunks of at most CHUNK_SIZE', () => {
    const chunks = splitIntoChunks('x'.repeat(CHUNK_SIZE * 2 + 1));
    expect(chunks.map((chunk) => chunk.length)).toEqual([
      CHUNK_SIZE,
      CHUNK_SIZE,
      1,
    ]);
  });
});
