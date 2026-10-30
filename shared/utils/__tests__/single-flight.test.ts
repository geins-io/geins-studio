// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createSingleFlight, type LockRequester } from '../single-flight';

const LOCK_NAME = 'geins-auth-refresh';
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** In-memory Web Locks stand-in: one holder per name, waiters in FIFO order. */
class FakeLocks implements LockRequester {
  private tails = new Map<string, Promise<unknown>>();
  active = 0;
  maxActive = 0;

  request<T>(name: string, callback: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(name) ?? Promise.resolve();
    const result = previous.then(async () => {
      this.active++;
      this.maxActive = Math.max(this.maxActive, this.active);
      try {
        return await callback();
      } finally {
        this.active--;
      }
    });
    this.tails.set(
      name,
      result.catch(() => undefined),
    );
    return result;
  }
}

/**
 * The session endpoint behind a shared cookie: a fetch refreshes when the
 * cookie it was sent with holds a due token, and the rotated token is what
 * every later fetch sees.
 */
const createSessionServer = () => {
  const state = { token: 'token-1', due: true, fetches: 0, refreshes: 0 };
  const getSession = async () => {
    const sentWithDueToken = state.due;
    state.fetches++;
    await nextTick();
    if (sentWithDueToken) {
      state.refreshes++;
      state.token = `token-${state.refreshes + 1}`;
      state.due = false;
    }
    return state.token;
  };
  return { state, getSession };
};

describe('createSingleFlight', () => {
  it('shares one in-flight call between concurrent callers in a tab', async () => {
    const { state, getSession } = createSessionServer();
    const refresh = createSingleFlight(getSession, { lockName: LOCK_NAME });

    const results = await Promise.all([refresh(), refresh(), refresh()]);

    expect(state.fetches).toBe(1);
    expect(state.refreshes).toBe(1);
    expect(results).toEqual(['token-2', 'token-2', 'token-2']);
  });

  it('starts a new call once the previous one settled', async () => {
    const { state, getSession } = createSessionServer();
    const refresh = createSingleFlight(getSession, { lockName: LOCK_NAME });

    await refresh();
    await refresh();

    expect(state.fetches).toBe(2);
    expect(state.refreshes).toBe(1);
  });

  it('refreshes once across tabs: a tab waiting on the lock reads the rotated token', async () => {
    const { state, getSession } = createSessionServer();
    const locks = new FakeLocks();
    const tabA = createSingleFlight(getSession, { lockName: LOCK_NAME, locks });
    const tabB = createSingleFlight(getSession, { lockName: LOCK_NAME, locks });

    const results = await Promise.all([tabA(), tabA(), tabB(), tabB()]);

    expect(state.refreshes).toBe(1);
    expect(state.fetches).toBe(2);
    expect(locks.maxActive).toBe(1);
    expect(results).toEqual(['token-2', 'token-2', 'token-2', 'token-2']);
  });

  it('without locks, tabs race and refresh twice (the case the lock prevents)', async () => {
    const { state, getSession } = createSessionServer();
    const tabA = createSingleFlight(getSession, { lockName: LOCK_NAME });
    const tabB = createSingleFlight(getSession, { lockName: LOCK_NAME });

    await Promise.all([tabA(), tabB()]);

    expect(state.refreshes).toBe(2);
  });

  it('passes a failure to every waiting caller, then runs again on the next call', async () => {
    let calls = 0;
    const refresh = createSingleFlight(
      async () => {
        calls++;
        await nextTick();
        if (calls === 1) {
          throw new Error('network');
        }
        return 'ok';
      },
      { lockName: LOCK_NAME, locks: new FakeLocks() },
    );

    const failed = await Promise.allSettled([refresh(), refresh()]);

    expect(failed.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
    ]);
    await expect(refresh()).resolves.toBe('ok');
    expect(calls).toBe(2);
  });
});
