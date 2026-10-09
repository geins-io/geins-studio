import type {
  Asset,
  AssetQuery,
  BatchQueryResult,
  MediaMove,
} from '#shared/types';
import { log } from './log';

const logger = log('job.ts');

/** One answer to "is this job done yet?", with whatever the check read. */
export interface JobCheck<T = unknown> {
  done: boolean;
  result?: T;
}

export type JobCheckFn<T = unknown> = () => Promise<JobCheck<T>>;

export type JobOutcomeState = 'completed' | 'timeout' | 'aborted';

export interface JobOutcome<T = unknown> {
  state: JobOutcomeState;
  /** The last result a check returned, if any did. */
  result?: T;
}

/** Wait `ms`, resolving early when `signal` aborts. */
export type JobSchedule = (ms: number, signal?: AbortSignal) => Promise<void>;

export interface SettleJobOptions {
  signal?: AbortSignal;
  /** Total wait across checks before giving up with `timeout`. */
  maxWaitMs?: number;
  /** Injectable for tests; defaults to a `setTimeout` wait. */
  schedule?: JobSchedule;
}

export const SETTLE_FIRST_DELAY_MS = 1_000;
export const SETTLE_MAX_DELAY_MS = 5_000;
export const SETTLE_MAX_WAIT_MS = 120_000;

/** Wait before check `attempt` (0-based): 1s → 2s → 4s, then 5s each. */
export function settleDelay(attempt: number): number {
  return Math.min(SETTLE_FIRST_DELAY_MS * 2 ** attempt, SETTLE_MAX_DELAY_MS);
}

const wait: JobSchedule = (ms, signal) =>
  new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', done, { once: true });
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
  });

/**
 * Poll `check` with backoff until it reports done, `maxWaitMs` of waiting has
 * passed, or `signal` aborts. The first check runs after the first delay — the
 * job was just accepted, so an immediate check would only say "not yet". A
 * check that throws counts as not done: it's logged and polling carries on.
 */
export async function settleJob<T>(
  check: JobCheckFn<T>,
  {
    signal,
    maxWaitMs = SETTLE_MAX_WAIT_MS,
    schedule = wait,
  }: SettleJobOptions = {},
): Promise<JobOutcome<T>> {
  let result: T | undefined;
  let waited = 0;
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) return { state: 'aborted', result };
    // The last delay is clipped so the final check lands on the limit.
    const delay = Math.min(settleDelay(attempt), maxWaitMs - waited);
    if (delay <= 0) return { state: 'timeout', result };
    await schedule(delay, signal);
    waited += delay;
    if (signal?.aborted) return { state: 'aborted', result };
    try {
      const outcome = await check();
      if ('result' in outcome) result = outcome.result;
      if (outcome.done) return { state: 'completed', result };
    } catch (error) {
      logger.geinsLogWarn('settle check failed, retrying', error);
    }
  }
}

// =============================================================================
// Checks — one per kind of delayed media job. Each takes the slice of
// `assetApi` it reads, so `assetApi` itself satisfies it.
// =============================================================================

export interface MoveCheckApi {
  move(moveId: string): Promise<MediaMove | null>;
}

export interface QueryCheckApi {
  find(body: AssetQuery): Promise<BatchQueryResult<Asset>>;
}

/**
 * A move (folder rename/move, relocate, bulk move, folder delete with
 * `relocate`) is done when `GET media/moves/{moveId}` says `completed`. A swept
 * move (`null`) is done too. The result is the move, for its `skippedCount`;
 * `null` once swept.
 */
export function moveCheck(
  api: MoveCheckApi,
  moveId: string,
): JobCheckFn<MediaMove | null> {
  return async () => {
    const move = await api.move(moveId);
    return { done: !move || move.state === 'completed', result: move };
  };
}

/**
 * A purge of known ids (bulk purge, delete permanently) is done when none of
 * them is still in the trash. The result is how many are left.
 */
export function purgeCheck(
  api: QueryCheckApi,
  assetIds: string[],
): JobCheckFn<number> {
  return async () => {
    const res = await api.find({
      assetIds,
      trashed: true,
      page: 1,
      pageSize: 1,
    });
    return { done: res.totalItemCount === 0, result: res.totalItemCount };
  };
}

/**
 * Far enough past now that only a fresh trash's retention clears it, and far
 * beyond any client clock skew.
 */
export const PURGE_DUE_MARGIN_MS = 60 * 60 * 1_000;

/**
 * A purge without known ids (empty trash, folder delete with `purge`) is done
 * when no trashed asset is due for purge. Every purge sets `purgeAfter` to now,
 * while a fresh trash gets now + retention, so the earliest `purgeAfter` tells
 * them apart without comparing the server's clock to ours. Assets expiring on
 * their own go in the same reaper pass, so they only add seconds.
 */
export function duePurgeCheck(
  api: QueryCheckApi,
  now: () => number = Date.now,
): JobCheckFn<void> {
  return async () => {
    const res = await api.find({
      trashed: true,
      sortBy: 'purgeAfter',
      sortDirection: 'asc',
      page: 1,
      pageSize: 1,
    });
    const first = Array.isArray(res.items) ? res.items[0] : undefined;
    const due = first?.purgeAfter ? Date.parse(first.purgeAfter) : NaN;
    return { done: !(due <= now() + PURGE_DUE_MARGIN_MS) };
  };
}

/** How long a replace waits when the CDN response can't tell old from new. */
export const REPLACE_FALLBACK_MS = 10_000;

export interface ReplaceCheckOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

/**
 * A replace is done when the CDN serves the new bytes: a `HEAD` on the bare
 * URL (no `?v=`, which is only a cache miss for a while after a replace)
 * returns the uploaded size. `asset` is the asset **before** the replace. When
 * the sizes match, or the CDN sends no `Content-Length`, size can't tell, so
 * the check waits `REPLACE_FALLBACK_MS` from its creation instead.
 */
export function replaceCheck(
  asset: Pick<Asset, 'url' | 'sizeBytes'>,
  sizeBytes: number,
  { fetch = globalThis.fetch, now = Date.now }: ReplaceCheckOptions = {},
): JobCheckFn<void> {
  const startedAt = now();
  const fallback = () => ({
    done: now() - startedAt >= REPLACE_FALLBACK_MS,
  });
  return async () => {
    if (!asset.url) return { done: true };
    if (asset.sizeBytes === sizeBytes) return fallback();
    const res = await fetch(asset.url.replace(/\?.*$/, ''), {
      method: 'HEAD',
      cache: 'no-store',
    });
    const length = res.headers.get('content-length');
    if (!res.ok || length === null) return fallback();
    return { done: Number(length) === sizeBytes };
  };
}
