// @vitest-environment node
import { unzipSync, strFromU8 } from 'fflate';
import { describe, it, expect, vi } from 'vitest';
import { buildZip, uniqueFileNames, zipFileName } from '../zip';

type Fetch = typeof globalThis.fetch;
const ok = (body: string) => new Response(body, { status: 200 });

async function entries(blob: Blob) {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  return Object.fromEntries(
    Object.entries(files).map(([name, data]) => [name, strFromU8(data)]),
  );
}

describe('uniqueFileNames', () => {
  it('numbers collisions before the extension, case-insensitively', () => {
    expect(
      uniqueFileNames(['hero.jpg', 'Hero.jpg', 'logo.svg', 'hero.jpg']),
    ).toEqual(['hero.jpg', 'Hero (2).jpg', 'logo.svg', 'hero (3).jpg']);
  });

  it('skips a number a real name already took', () => {
    expect(uniqueFileNames(['a.png', 'a (2).png', 'a.png'])).toEqual([
      'a.png',
      'a (2).png',
      'a (3).png',
    ]);
  });

  it('appends to names without an extension or with a leading dot', () => {
    expect(uniqueFileNames(['README', 'README', '.env', '.env'])).toEqual([
      'README',
      'README (2)',
      '.env',
      '.env (2)',
    ]);
  });
});

describe('zipFileName', () => {
  it('uses the local date', () => {
    expect(zipFileName('assets', new Date(2026, 0, 5, 23, 59))).toBe(
      'assets-2026-01-05.zip',
    );
  });
});

describe('buildZip', () => {
  it('zips every source flat with de-duplicated names', async () => {
    const fetch = vi.fn<Fetch>((url) =>
      Promise.resolve(ok(`body:${String(url)}`)),
    );
    const onProgress = vi.fn();
    const result = await buildZip(
      [
        { name: 'a.txt', url: 'u1' },
        { name: 'a.txt', url: 'u2' },
        { name: 'b.txt', url: 'u3' },
      ],
      { fetch, onProgress },
    );
    expect(result.added).toBe(3);
    expect(result.failed).toEqual([]);
    expect(await entries(result.blob!)).toEqual({
      'a.txt': 'body:u1',
      'a (2).txt': 'body:u2',
      'b.txt': 'body:u3',
    });
    expect(onProgress).toHaveBeenLastCalledWith(3, 3);
  });

  it('skips and reports files that fail', async () => {
    const fetch = vi.fn<Fetch>((url) =>
      url === 'bad'
        ? Promise.resolve(new Response('', { status: 404 }))
        : url === 'down'
          ? Promise.reject(new TypeError('Failed to fetch'))
          : Promise.resolve(ok('ok')),
    );
    const result = await buildZip(
      [
        { name: 'a.txt', url: 'good' },
        { name: 'b.txt', url: 'bad' },
        { name: 'c.txt', url: 'down' },
      ],
      { fetch },
    );
    expect(result.added).toBe(1);
    expect(result.failed.map((f) => f.name)).toEqual(['b.txt', 'c.txt']);
    expect(Object.keys(await entries(result.blob!))).toEqual(['a.txt']);
  });

  it('returns no blob when every file fails', async () => {
    const fetch = vi.fn<Fetch>(() =>
      Promise.resolve(new Response('', { status: 500 })),
    );
    const result = await buildZip([{ name: 'a.txt', url: 'u' }], {
      fetch,
    });
    expect(result.blob).toBeNull();
    expect(result.failed).toHaveLength(1);
  });

  it('keeps at most `concurrency` fetches in flight', async () => {
    let inFlight = 0;
    let peak = 0;
    const fetch = vi.fn<Fetch>(async () => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;
      return ok('x');
    });
    const sources = Array.from({ length: 10 }, (_, i) => ({
      name: `${i}.txt`,
      url: `${i}`,
    }));
    await buildZip(sources, {
      concurrency: 3,
      fetch,
    });
    expect(fetch).toHaveBeenCalledTimes(10);
    expect(peak).toBe(3);
  });

  it('stops fetching and returns no blob once aborted', async () => {
    const controller = new AbortController();
    const fetch = vi.fn<Fetch>(async () => {
      controller.abort();
      return ok('x');
    });
    const result = await buildZip(
      Array.from({ length: 5 }, (_, i) => ({ name: `${i}`, url: `${i}` })),
      {
        concurrency: 1,
        signal: controller.signal,
        fetch,
      },
    );
    expect(result.blob).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
