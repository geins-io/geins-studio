// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type { Session } from '#shared/types';
import {
  createUnauthorizedRecovery,
  forcedRefreshOutcome,
  unauthorizedAction,
  userLoadRetryDelay,
  type FailedApiRequest,
} from '../auth-recovery';
import { createSingleFlight } from '../single-flight';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

const rejected: FailedApiRequest = {
  status: 401,
  sentTokenExpires: 1001,
  currentTokenExpires: 1001,
  isAuthenticated: true,
  onAuthPage: false,
  retried: false,
};

const signedIn = (tokenExpires: number): Session => ({
  isAuthenticated: true,
  accountKey: 'account-1',
  tokenExpires,
});

describe('unauthorizedAction', () => {
  it('forces a refresh on a 401 to the token the tab still holds', () => {
    expect(unauthorizedAction(rejected)).toBe('force-refresh');
  });

  it('retries without a refresh when the token was replaced meanwhile', () => {
    expect(unauthorizedAction({ ...rejected, currentTokenExpires: 1002 })).toBe(
      'retry',
    );
  });

  it('logs out on a 401 to the retry', () => {
    expect(unauthorizedAction({ ...rejected, retried: true })).toBe('logout');
  });

  it.each([
    ['no token was sent', { sentTokenExpires: undefined }],
    ['on an auth page', { onAuthPage: true }],
    ['before sign-in', { isAuthenticated: false }],
    ['on a 403', { status: 403 }],
    ['on a 500', { status: 500 }],
  ])('ignores it when %s', (_, change) => {
    expect(unauthorizedAction({ ...rejected, ...change })).toBe('ignore');
    expect(unauthorizedAction({ ...rejected, ...change, retried: true })).toBe(
      'ignore',
    );
  });
});

describe('forcedRefreshOutcome', () => {
  it('retries with a new token', () => {
    expect(forcedRefreshOutcome(signedIn(1002), 1001)).toBe('retry');
  });

  it('fails without a logout when the refresh failed and kept the token', () => {
    expect(
      forcedRefreshOutcome({ ...signedIn(1001), error: 'RefreshFailed' }, 1001),
    ).toBe('fail');
  });

  it('leaves a RefreshTokenInvalid session to the auth-state re-check', () => {
    expect(
      forcedRefreshOutcome(
        { isAuthenticated: false, error: 'RefreshTokenInvalid' },
        1001,
      ),
    ).toBe('fail');
  });

  it.each([null, undefined, { isAuthenticated: false }])(
    'logs out when no session is left (%o)',
    (session) => {
      expect(forcedRefreshOutcome(session, 1001)).toBe('logout');
    },
  );
});

describe('createUnauthorizedRecovery', () => {
  const setup = (
    refresh: (
      rejectedTokenExpires?: number,
    ) => Promise<Session | null | undefined> = async () => signedIn(1002),
  ) => {
    const run = vi.fn(refresh);
    const logout = vi.fn(async () => {});
    const onError = vi.fn();
    const recover = createUnauthorizedRecovery({
      forceRefresh: createSingleFlight(run, { lockName: 'test' }),
      logout,
      onError,
    });
    return { recover, run, logout, onError };
  };

  it('forces a refresh and retries, without a logout, on a 401 to an unexpired token', async () => {
    const { recover, run, logout } = setup();

    await expect(recover(rejected)).resolves.toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(1001);
    expect(logout).not.toHaveBeenCalled();
  });

  it('logs out exactly once when the retry gets a 401 too', async () => {
    const { recover, run, logout } = setup();

    await expect(recover(rejected)).resolves.toBe(true);
    const retry = {
      ...rejected,
      sentTokenExpires: 1002,
      currentTokenExpires: 1002,
    };
    await expect(recover({ ...retry, retried: true })).resolves.toBe(false);
    await expect(recover({ ...retry, retried: true })).resolves.toBe(false);

    expect(run).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('leaves a RefreshTokenInvalid refresh to the existing logout path', async () => {
    const { recover, logout } = setup(async () => ({
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    }));

    await expect(recover(rejected)).resolves.toBe(false);
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps the session when the forced refresh fails transiently', async () => {
    const { recover, logout } = setup(async () => ({
      ...signedIn(1001),
      error: 'RefreshFailed',
    }));

    await expect(recover(rejected)).resolves.toBe(false);
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps the session when the session endpoint is unreachable', async () => {
    const error = new Error('offline');
    const { recover, logout, onError } = setup(async () => {
      throw error;
    });

    await expect(recover(rejected)).resolves.toBe(false);
    expect(logout).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('logs out when the forced refresh leaves no session', async () => {
    const { recover, logout } = setup(async () => null);

    await expect(recover(rejected)).resolves.toBe(false);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no token was sent', { sentTokenExpires: undefined }],
    ['on the login page', { onAuthPage: true }],
  ])('neither refreshes nor logs out when %s', async (_, change) => {
    const { recover, run, logout } = setup();

    await expect(recover({ ...rejected, ...change })).resolves.toBe(false);
    await expect(
      recover({ ...rejected, ...change, retried: true }),
    ).resolves.toBe(false);
    expect(run).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it('shares one forced refresh between concurrent 401s and logs out at most once', async () => {
    let finish!: (session: Session) => void;
    const { recover, run, logout } = setup(
      () => new Promise<Session>((resolve) => (finish = resolve)),
    );

    const first = Array.from({ length: 5 }, () => recover(rejected));
    await nextTick();
    finish(signedIn(1002));
    expect(await Promise.all(first)).toEqual([true, true, true, true, true]);
    expect(run).toHaveBeenCalledTimes(1);

    // A 401 to the old token that lands after the refresh retries with the new one.
    await expect(
      recover({ ...rejected, currentTokenExpires: 1002 }),
    ).resolves.toBe(true);
    expect(run).toHaveBeenCalledTimes(1);

    const retried = {
      ...rejected,
      sentTokenExpires: 1002,
      currentTokenExpires: 1002,
      retried: true,
    };
    const second = Array.from({ length: 6 }, () => recover(retried));
    expect(await Promise.all(second)).toEqual(Array(6).fill(false));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('allows another logout after one failed', async () => {
    const { recover, logout, onError } = setup();
    logout.mockRejectedValueOnce(new Error('no csrf token'));
    const retried = { ...rejected, retried: true };

    await recover(retried);
    await nextTick();
    await recover(retried);

    expect(logout).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('userLoadRetryDelay', () => {
  it.each([0, 408, 429, 500, 502, 503, 504])(
    'retries a %i with growing pauses, then stops',
    (status) => {
      const delays = [0, 1, 2, 3, 4].map((attempt) =>
        userLoadRetryDelay(attempt, status),
      );

      expect(delays).toEqual([1_000, 2_000, 5_000, 10_000, undefined]);
    },
  );

  it.each([400, 401, 403, 404, undefined])("doesn't retry a %s", (status) => {
    expect(userLoadRetryDelay(0, status)).toBeUndefined();
  });
});
