// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type { Asset, BatchQueryResult, MediaMove } from '#shared/types';
import {
  backgroundJobCheck,
  cdnEtag,
  duePurgeCheck,
  moveCheck,
  movesCheck,
  purgeCheck,
  PURGE_DUE_MARGIN_MS,
  REPLACE_FALLBACK_MS,
  replaceCheck,
  settleDelay,
  settleJob,
  SETTLE_MAX_WAIT_MS,
  type JobCheck,
  type JobSchedule,
} from '../job';

/** Records each wait and returns at once, so a run takes no real time. */
function fakeSchedule(onWait?: (ms: number) => void) {
  const waits: number[] = [];
  const schedule: JobSchedule = async (ms) => {
    waits.push(ms);
    onWait?.(ms);
  };
  return { schedule, waits };
}

/** Answers each check in turn, repeating the last answer. */
function checks<T>(...answers: (JobCheck<T> | Error)[]) {
  let i = 0;
  return vi.fn(async () => {
    const answer = answers[Math.min(i++, answers.length - 1)]!;
    if (answer instanceof Error) throw answer;
    return answer;
  });
}

const move = (state: MediaMove['state'], skippedCount = 0): MediaMove => ({
  _id: 'm1',
  _type: 'geins.move',
  state,
  itemCount: 3,
  movedCount: 3 - skippedCount,
  skippedCount,
  createdAt: '2026-10-09T08:00:00Z',
  completedAt: state === 'completed' ? '2026-10-09T08:00:05Z' : null,
});

const page = (
  items: Partial<Asset>[],
  totalItemCount = items.length,
): BatchQueryResult<Asset> => ({
  _id: 'b1',
  page: 1,
  pageSize: 1,
  pageCount: 1,
  totalItemCount,
  items: items as Asset[],
});

describe('settleDelay', () => {
  it('backs off 1s → 2s → 4s, then caps at 5s', () => {
    expect([0, 1, 2, 3, 4].map(settleDelay)).toEqual([
      1000, 2000, 4000, 5000, 5000,
    ]);
  });
});

describe('settleJob', () => {
  it('completes once a check says done, with its result', async () => {
    const { schedule, waits } = fakeSchedule();
    const check = checks({ done: false, result: 1 }, { done: true, result: 2 });
    await expect(settleJob(check, { schedule })).resolves.toEqual({
      state: 'completed',
      result: 2,
    });
    // Waits before the first check — the job was only just accepted.
    expect(waits).toEqual([1000, 2000]);
  });

  it('treats a swept move (404 → null) as completed', async () => {
    const { schedule } = fakeSchedule();
    const api = { move: vi.fn().mockResolvedValue(null) };
    await expect(
      settleJob(moveCheck(api, 'm1'), { schedule }),
    ).resolves.toEqual({ state: 'completed', result: null });
  });

  it('times out at maxWaitMs, clipping the last wait onto the limit', async () => {
    const { schedule, waits } = fakeSchedule();
    const check = checks({ done: false, result: 'pending' });
    await expect(settleJob(check, { schedule })).resolves.toEqual({
      state: 'timeout',
      result: 'pending',
    });
    expect(waits.reduce((a, b) => a + b, 0)).toBe(SETTLE_MAX_WAIT_MS);
    expect(waits.at(-1)).toBeLessThanOrEqual(5000);
    expect(check).toHaveBeenCalledTimes(waits.length);
  });

  it('stops with aborted when the signal aborts mid-wait', async () => {
    const controller = new AbortController();
    const { schedule } = fakeSchedule(() => controller.abort());
    const check = checks({ done: false });
    await expect(
      settleJob(check, { schedule, signal: controller.signal }),
    ).resolves.toEqual({ state: 'aborted', result: undefined });
    expect(check).not.toHaveBeenCalled();
  });

  it('returns aborted without waiting on an already-aborted signal', async () => {
    const { schedule, waits } = fakeSchedule();
    await expect(
      settleJob(checks({ done: true }), {
        schedule,
        signal: AbortSignal.abort(),
      }),
    ).resolves.toEqual({ state: 'aborted', result: undefined });
    expect(waits).toEqual([]);
  });

  it('keeps polling past a check that throws', async () => {
    const { schedule } = fakeSchedule();
    const check = checks<string>(new Error('502'), {
      done: true,
      result: 'ok',
    });
    await expect(settleJob(check, { schedule })).resolves.toEqual({
      state: 'completed',
      result: 'ok',
    });
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('times out when every check throws', async () => {
    const { schedule } = fakeSchedule();
    await expect(
      settleJob(checks(new Error('down')), { schedule, maxWaitMs: 3000 }),
    ).resolves.toEqual({ state: 'timeout', result: undefined });
  });

  it('waits on real timers by default and wakes early on abort', async () => {
    const controller = new AbortController();
    const run = settleJob(checks({ done: false }), {
      signal: controller.signal,
    });
    controller.abort();
    await expect(run).resolves.toEqual({
      state: 'aborted',
      result: undefined,
    });
  });
});

describe('moveCheck', () => {
  it('is not done while pending', async () => {
    const api = { move: vi.fn().mockResolvedValue(move('pending')) };
    await expect(moveCheck(api, 'm1')()).resolves.toMatchObject({
      done: false,
    });
    expect(api.move).toHaveBeenCalledWith('m1');
  });

  it('is done when completed, surfacing skippedCount', async () => {
    const api = { move: vi.fn().mockResolvedValue(move('completed', 1)) };
    const { done, result } = await moveCheck(api, 'm1')();
    expect(done).toBe(true);
    expect(result?.skippedCount).toBe(1);
  });
});

describe('movesCheck', () => {
  const at = (
    id: string,
    state: MediaMove['state'],
    itemCount: number,
    movedCount: number,
    skippedCount = 0,
  ): MediaMove => ({
    ...move(state),
    _id: id,
    itemCount,
    movedCount,
    skippedCount,
  });

  it('sums progress across moves and is done when all are', async () => {
    const api = {
      move: vi
        .fn()
        .mockResolvedValueOnce(at('m1', 'completed', 100, 99, 1))
        .mockResolvedValueOnce(at('m2', 'pending', 40, 10))
        .mockResolvedValueOnce(at('m2', 'completed', 40, 40)),
    };
    const check = movesCheck(api, ['m1', 'm2']);
    await expect(check()).resolves.toEqual({
      done: false,
      result: { done: 110, total: 140, skipped: 1 },
    });
    await expect(check()).resolves.toEqual({
      done: true,
      result: { done: 140, total: 140, skipped: 1 },
    });
    // A completed move isn't read again.
    expect(api.move.mock.calls.map(([id]) => id)).toEqual(['m1', 'm2', 'm2']);
  });

  it('counts a swept move (null) as settled', async () => {
    const api = { move: vi.fn().mockResolvedValue(null) };
    await expect(movesCheck(api, ['m1'])()).resolves.toEqual({
      done: true,
      result: { done: 0, total: 0, skipped: 0 },
    });
  });

  it('keeps the last counts of a move once it is swept', async () => {
    const api = {
      move: vi
        .fn()
        .mockResolvedValueOnce(at('m1', 'pending', 10, 4, 1))
        .mockResolvedValueOnce(null),
    };
    const check = movesCheck(api, ['m1']);
    await check();
    await expect(check()).resolves.toEqual({
      done: true,
      result: { done: 5, total: 10, skipped: 1 },
    });
  });
});

describe('backgroundJobCheck', () => {
  it('rebuilds a move check from its spec', async () => {
    const api = { move: vi.fn().mockResolvedValue(move('completed')) };
    const check = backgroundJobCheck({ kind: 'move', moveIds: ['m1'] }, api);
    await expect(check()).resolves.toMatchObject({ done: true });
    expect(api.move).toHaveBeenCalledWith('m1');
  });

  it('rebuilds a replace check from its spec', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { headers: { etag: '"new"' } }));
    const check = backgroundJobCheck(
      { kind: 'replace', url: 'https://cdn.test/a.jpg', etagBefore: '"old"' },
      { move: vi.fn() },
      { fetch },
    );
    await expect(check()).resolves.toEqual({ done: true });
  });
});

describe('purgeCheck', () => {
  it('asks for the ids still in the trash, one row', async () => {
    const api = { find: vi.fn().mockResolvedValue(page([{}], 2)) };
    await expect(purgeCheck(api, ['a1', 'a2'])()).resolves.toEqual({
      done: false,
      result: 2,
    });
    expect(api.find).toHaveBeenCalledWith({
      assetIds: ['a1', 'a2'],
      trashed: true,
      page: 1,
      pageSize: 1,
    });
  });

  it('is done when none is left', async () => {
    const api = { find: vi.fn().mockResolvedValue(page([], 0)) };
    await expect(purgeCheck(api, ['a1'])()).resolves.toEqual({
      done: true,
      result: 0,
    });
  });
});

describe('duePurgeCheck', () => {
  const now = Date.parse('2026-10-09T08:00:00Z');
  const at = (ms: number) => new Date(now + ms).toISOString();
  const run = (items: Partial<Asset>[]) => {
    const api = { find: vi.fn().mockResolvedValue(page(items)) };
    return { api, result: duePurgeCheck(api, () => now)() };
  };

  it('reads the earliest purgeAfter in the trash', async () => {
    const { api, result } = run([]);
    await result;
    expect(api.find).toHaveBeenCalledWith({
      trashed: true,
      sortBy: 'purgeAfter',
      sortDirection: 'asc',
      page: 1,
      pageSize: 1,
    });
  });

  it('is done when the trash is empty', async () => {
    await expect(run([]).result).resolves.toEqual({ done: true });
  });

  it('is not done while an asset is due (purgeAfter at or before now)', async () => {
    await expect(run([{ purgeAfter: at(-2000) }]).result).resolves.toEqual({
      done: false,
    });
  });

  it('is not done for a purgeAfter just ahead of a skewed client clock', async () => {
    await expect(run([{ purgeAfter: at(60_000) }]).result).resolves.toEqual({
      done: false,
    });
  });

  it('is done when the earliest is a fresh trash, past the margin', async () => {
    await expect(
      run([{ purgeAfter: at(PURGE_DUE_MARGIN_MS + 1) }]).result,
    ).resolves.toEqual({ done: true });
    await expect(
      run([{ purgeAfter: at(30 * 24 * 60 * 60 * 1000) }]).result,
    ).resolves.toEqual({ done: true });
  });
});

const head = (status: number, etag?: string) =>
  vi.fn().mockResolvedValue(
    new Response(null, {
      status,
      headers: etag === undefined ? {} : { etag },
    }),
  );

describe('cdnEtag', () => {
  it('HEADs the bare URL past the browser cache', async () => {
    const fetch = head(200, '"e1"');
    await expect(cdnEtag('https://cdn.test/a.jpg?v=abc', fetch)).resolves.toBe(
      '"e1"',
    );
    expect(fetch).toHaveBeenCalledWith('https://cdn.test/a.jpg', {
      method: 'HEAD',
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
  });

  it('is null without a URL, on a non-ok answer, or when the HEAD throws', async () => {
    await expect(cdnEtag(null, head(200, '"e1"'))).resolves.toBeNull();
    await expect(cdnEtag('https://x', head(404, '"e1"'))).resolves.toBeNull();
    await expect(
      cdnEtag('https://x', vi.fn().mockRejectedValue(new TypeError('cors'))),
    ).resolves.toBeNull();
  });
});

describe('replaceCheck', () => {
  const url = 'https://cdn.test/acc/hero.jpg';

  it('is not done while the CDN serves the same file', async () => {
    await expect(
      replaceCheck(url, '"old"', { fetch: head(200, '"old"') })(),
    ).resolves.toEqual({ done: false });
  });

  it('is done once the CDN serves another file', async () => {
    await expect(
      replaceCheck(url, '"old"', { fetch: head(200, '"new"') })(),
    ).resolves.toEqual({ done: true });
  });

  it('falls back to a fixed delay without a baseline', async () => {
    let clock = 0;
    const fetch = head(200, '"new"');
    const check = replaceCheck(url, null, { fetch, now: () => clock });
    await expect(check()).resolves.toEqual({ done: false });
    clock = REPLACE_FALLBACK_MS;
    await expect(check()).resolves.toEqual({ done: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('counts the fallback from the job start when resumed', async () => {
    const check = replaceCheck(url, null, {
      now: () => 50_000,
      startedAt: 50_000 - REPLACE_FALLBACK_MS,
    });
    await expect(check()).resolves.toEqual({ done: true });
  });

  it('falls back to a fixed delay when the ETag cannot be read', async () => {
    let clock = 0;
    const check = replaceCheck(url, '"old"', {
      fetch: head(503),
      now: () => clock,
    });
    await expect(check()).resolves.toEqual({ done: false });
    clock = REPLACE_FALLBACK_MS;
    await expect(check()).resolves.toEqual({ done: true });
  });

  it('is done at once for an asset without a URL', async () => {
    const fetch = head(200, '"new"');
    await expect(replaceCheck(null, '"old"', { fetch })()).resolves.toEqual({
      done: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
