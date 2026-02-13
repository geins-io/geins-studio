// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../log', () => ({
  log: () => ({
    geinsLog: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
    geinsLogInfo: vi.fn(),
  }),
}));

import { getBaseUrl, getAuthBaseUrl } from '../deployment';

const ENV_KEYS = [
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_TARGET_ENV',
  'VERCEL_BRANCH_URL',
  'BASE_URL',
  'AUTH_PATH',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] !== undefined) {
      process.env[key] = saved[key];
    } else {
      delete process.env[key];
    }
  }
});

describe('getBaseUrl', () => {
  it('returns Vercel branch URL in preview environment', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_TARGET_ENV = 'preview';
    process.env.VERCEL_BRANCH_URL = 'my-branch-abc123.vercel.app';
    expect(getBaseUrl()).toBe('https://my-branch-abc123.vercel.app');
  });

  it('requires all three Vercel vars for preview URL', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    // Missing VERCEL_TARGET_ENV
    process.env.VERCEL_BRANCH_URL = 'my-branch.vercel.app';
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });

  it('returns BASE_URL when set', () => {
    process.env.BASE_URL = 'https://studio.geins.io';
    expect(getBaseUrl()).toBe('https://studio.geins.io');
  });

  it('returns localhost fallback when no env vars are set', () => {
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });

  it('returns BASE_URL in production even with VERCEL set', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_TARGET_ENV = 'production';
    process.env.BASE_URL = 'https://studio.geins.io';
    expect(getBaseUrl()).toBe('https://studio.geins.io');
  });

  it('falls back to localhost in production without BASE_URL', () => {
    process.env.VERCEL_TARGET_ENV = 'production';
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});

describe('getAuthBaseUrl', () => {
  it('appends /api/auth by default', () => {
    expect(getAuthBaseUrl()).toBe('http://localhost:3000/api/auth');
  });

  it('uses AUTH_PATH env var when set', () => {
    process.env.AUTH_PATH = '/custom/auth';
    expect(getAuthBaseUrl()).toBe('http://localhost:3000/custom/auth');
  });

  it('combines Vercel preview URL with default auth path', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_TARGET_ENV = 'preview';
    process.env.VERCEL_BRANCH_URL = 'my-branch.vercel.app';
    expect(getAuthBaseUrl()).toBe('https://my-branch.vercel.app/api/auth');
  });

  it('combines BASE_URL with custom AUTH_PATH', () => {
    process.env.BASE_URL = 'https://studio.geins.io';
    process.env.AUTH_PATH = '/auth/v2';
    expect(getAuthBaseUrl()).toBe('https://studio.geins.io/auth/v2');
  });
});
