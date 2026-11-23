// @vitest-environment node
/* eslint-disable import/order, import/first */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Every source request answers a redirect to `redirect.location`.
const requested = vi.hoisted(() => [] as string[]);
const redirect = vi.hoisted(() => ({ location: '' }));
vi.mock('nuxt/server', () => ({ deriveSecret: async () => 'a'.repeat(64) }));
vi.mock('#shared/utils/log', () => ({
  log: () => ({
    geinsLog: vi.fn(),
    geinsLogWarn: vi.fn(),
    geinsLogError: vi.fn(),
  }),
}));
vi.mock('undici', async (importOriginal) => ({
  ...(await importOriginal<typeof import('undici')>()),
  request: vi.fn(async (url: URL | string) => {
    requested.push(String(url));
    return {
      statusCode: 302,
      headers: { location: redirect.location },
      body: { dump: async () => null },
    };
  }),
}));

import { probeSource, transferSource } from '../utils/media-import';

const SOURCE = new URL('https://cdn.example.com/a.jpg');
const transfer = () =>
  transferSource(SOURCE, {
    sourceUrl: SOURCE.href,
    uploadUrl: 'https://gestmediaqa.blob.core.windows.net/media/a.jpg',
    sizeBytes: 1,
    mimeType: 'image/jpeg',
  });

beforeEach(() => {
  requested.length = 0;
});

describe('media import redirects', () => {
  it.each([
    ['https://127.0.0.1/a.jpg', 'SOURCE_BLOCKED'],
    ['https://169.254.169.254/latest/meta-data/', 'SOURCE_BLOCKED'],
    ['https://[::ffff:10.0.0.1]/a.jpg', 'SOURCE_BLOCKED'],
    ['https://localhost/a.jpg', 'SOURCE_BLOCKED'],
    ['http://cdn.example.com/a.jpg', 'SOURCE_UNREACHABLE'],
  ])('never requests a hop to %s', async (location, error) => {
    redirect.location = location;
    expect(await probeSource(SOURCE)).toEqual({ error });
    expect(await transfer()).toEqual({ error });
    expect(requested).toEqual([SOURCE.href, SOURCE.href]);
  });

  it('gives up after 5 redirects', async () => {
    redirect.location = '/next';
    expect(await probeSource(SOURCE)).toEqual({ error: 'SOURCE_UNREACHABLE' });
    expect(requested).toHaveLength(6);
  });
});
