// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type { AuthResponse, Session } from '#shared/types';
import {
  AuthApiError,
  refreshRetryDelay,
  refreshWithRetry,
  sessionFromToken,
  tokenAfterRefresh,
  tokenAfterRefreshError,
} from '../auth-session';

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
const fakeJwt = (payload: { exp: number; iat: number }) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;

const EXPIRES = '2026-11-30T12:00:00.000Z';

const authenticatedToken: Session = {
  isAuthenticated: true,
  accessToken: fakeJwt({ exp: 2000, iat: 1000 }),
  refreshToken: 'refresh-1',
  accountKey: 'account-1',
  tokenExpires: 2000,
  refreshedAt: 1000,
  mfaActive: false,
};

describe('tokenAfterRefreshError', () => {
  it.each([500, 502, 503, 504])('keeps the session on a %i', (status) => {
    const next = tokenAfterRefreshError(
      authenticatedToken,
      new AuthApiError(status, 'Server error'),
    );

    expect(next).toEqual({ ...authenticatedToken, error: 'RefreshFailed' });
  });

  it('keeps the session on a network error or timeout', () => {
    const next = tokenAfterRefreshError(
      authenticatedToken,
      new AuthApiError(0, 'Request failed', { cause: new Error('ETIMEDOUT') }),
    );

    expect(next.accessToken).toBe(authenticatedToken.accessToken);
    expect(next.isAuthenticated).toBe(true);
    expect(next.error).toBe('RefreshFailed');
  });

  it.each([0, 408, 429])('keeps the session on a %i', (status) => {
    const next = tokenAfterRefreshError(
      authenticatedToken,
      new AuthApiError(status, 'Try again'),
    );

    expect(next.error).toBe('RefreshFailed');
    expect(next.isAuthenticated).toBe(true);
    expect(next.refreshToken).toBe('refresh-1');
  });

  it('keeps the session on an error without a status', () => {
    const next = tokenAfterRefreshError(authenticatedToken, new Error('boom'));

    expect(next.error).toBe('RefreshFailed');
    expect(next.isAuthenticated).toBe(true);
  });

  it.each([400, 401, 403, 404])(
    'marks the refresh token invalid and drops the tokens on a %i',
    (status) => {
      const next = tokenAfterRefreshError(
        authenticatedToken,
        new AuthApiError(status, 'Rejected'),
      );

      expect(next).toEqual({
        isAuthenticated: false,
        error: 'RefreshTokenInvalid',
      });
      expect(next).not.toHaveProperty('refreshToken');
    },
  );

  // Regression: keeping the token on this 403 left a session that looked
  // signed in, 401'd every API call and retried the refresh forever.
  it('signs out when an expired refresh token is answered with 403', () => {
    const next = tokenAfterRefreshError(
      authenticatedToken,
      new AuthApiError(403, 'Insufficient permissions'),
    );

    expect(next.error).toBe('RefreshTokenInvalid');
    expect(sessionFromToken(next, EXPIRES)).toEqual({
      expires: EXPIRES,
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    });
  });
});

describe('refreshWithRetry', () => {
  const refreshedResponse: AuthResponse = {
    accessToken: fakeJwt({ exp: 5000, iat: 4000 }),
    refreshToken: 'refresh-2',
  };

  // Each answer is one call to auth/refresh: a response, or the error it throws.
  const setup = (...answers: (AuthResponse | AuthApiError)[]) => {
    const refresh = vi.fn(async (_refreshToken?: string) => {
      const answer = answers.shift();
      if (!answer) throw new Error('Unexpected refresh call');
      if (answer instanceof AuthApiError) throw answer;
      return answer;
    });
    const wait = vi.fn(async (_ms: number) => {});
    const onRetry = vi.fn();
    // As the jwt callback does: a response becomes the token, an error is
    // classified.
    const run = () =>
      refreshWithRetry(refresh, authenticatedToken.refreshToken, {
        wait,
        onRetry,
      }).then(
        (response) => tokenAfterRefresh(authenticatedToken, response),
        (error) => tokenAfterRefreshError(authenticatedToken, error),
      );
    return { refresh, wait, onRetry, run };
  };

  it('refreshes on a retry after one 403', async () => {
    const { refresh, wait, onRetry, run } = setup(
      new AuthApiError(403, 'Insufficient permissions'),
      refreshedResponse,
    );

    const next = await run();

    expect(next.error).toBeUndefined();
    expect(next.isAuthenticated).toBe(true);
    expect(next.accessToken).toBe(refreshedResponse.accessToken);
    expect(next.refreshToken).toBe('refresh-2');
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(403, 2);
    expect(wait).toHaveBeenCalledOnce();
    const [delay] = wait.mock.calls[0]!;
    expect(delay).toBeGreaterThanOrEqual(300);
    expect(delay).toBeLessThanOrEqual(800);
  });

  it('retries with the same refresh token', async () => {
    const { refresh, run } = setup(
      new AuthApiError(403, 'Insufficient permissions'),
      refreshedResponse,
    );

    await run();

    expect(refresh).toHaveBeenNthCalledWith(1, 'refresh-1');
    expect(refresh).toHaveBeenNthCalledWith(2, 'refresh-1');
  });

  it('waits before it retries', async () => {
    const { refresh, wait, run } = setup(
      new AuthApiError(403, 'Insufficient permissions'),
      refreshedResponse,
    );
    let callsWhenWaiting = 0;
    wait.mockImplementationOnce(async () => {
      callsWhenWaiting = refresh.mock.calls.length;
    });

    await run();

    expect(callsWhenWaiting).toBe(1);
  });

  it('signs out after two 403s in a row', async () => {
    const { refresh, run } = setup(
      new AuthApiError(403, 'Insufficient permissions'),
      new AuthApiError(403, 'Insufficient permissions'),
    );

    const next = await run();

    expect(next).toEqual({
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a 503', new AuthApiError(503, 'Server error')],
    ['a network error', new AuthApiError(0, 'Request failed')],
  ])(
    'keeps the session when the retry after a 403 gets %s',
    async (_, retryError) => {
      const { refresh, run } = setup(
        new AuthApiError(403, 'Insufficient permissions'),
        retryError,
      );

      const next = await run();

      expect(next).toEqual({ ...authenticatedToken, error: 'RefreshFailed' });
      expect(next.refreshToken).toBe('refresh-1');
      expect(refresh).toHaveBeenCalledTimes(2);
    },
  );

  it.each([400, 401, 404])(
    'signs out on a %i without a retry',
    async (status) => {
      const { refresh, wait, onRetry, run } = setup(
        new AuthApiError(status, 'Rejected'),
      );

      const next = await run();

      expect(next.error).toBe('RefreshTokenInvalid');
      expect(refresh).toHaveBeenCalledOnce();
      expect(wait).not.toHaveBeenCalled();
      expect(onRetry).not.toHaveBeenCalled();
    },
  );

  it.each([0, 408, 429, 500, 503])(
    'keeps the session on a %i without a retry',
    async (status) => {
      const { refresh, wait, run } = setup(
        new AuthApiError(status, 'Try again'),
      );

      const next = await run();

      expect(next).toEqual({ ...authenticatedToken, error: 'RefreshFailed' });
      expect(refresh).toHaveBeenCalledOnce();
      expect(wait).not.toHaveBeenCalled();
    },
  );

  it('does not retry an error without a status', async () => {
    const refresh = vi.fn(async () => {
      throw new Error('boom');
    });
    const wait = vi.fn(async () => {});

    await expect(
      refreshWithRetry(refresh, 'refresh-1', { wait }),
    ).rejects.toThrow('boom');
    expect(refresh).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });
});

describe('refreshRetryDelay', () => {
  it.each([
    [0, 300],
    [0.5, 550],
    [0.999_999, 800],
  ])('maps random %d to %i ms', (random, delay) => {
    expect(refreshRetryDelay(() => random)).toBe(delay);
  });
});

describe('tokenAfterRefresh', () => {
  it('takes the new tokens, keeps the account and clears the error', () => {
    const accessToken = fakeJwt({ exp: 5000, iat: 4000 });
    const next = tokenAfterRefresh(
      { ...authenticatedToken, error: 'RefreshFailed' },
      { accessToken, refreshToken: 'refresh-2' },
    );

    expect(next).toEqual({
      isAuthenticated: true,
      accessToken,
      refreshToken: 'refresh-2',
      accountKey: 'account-1',
      tokenExpires: 5000,
      refreshedAt: 4000,
      mfaActive: false,
    });
  });

  it('keeps the old refresh token when none is returned', () => {
    const next = tokenAfterRefresh(authenticatedToken, {
      accessToken: fakeJwt({ exp: 5000, iat: 4000 }),
    });

    expect(next.refreshToken).toBe('refresh-1');
  });

  it('turns a malformed access token into a retryable failure', () => {
    let thrown: unknown;
    try {
      tokenAfterRefresh(authenticatedToken, { accessToken: 'not-a-jwt' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(tokenAfterRefreshError(authenticatedToken, thrown)).toEqual({
      ...authenticatedToken,
      error: 'RefreshFailed',
    });
  });

  it('throws a retryable error when no access token comes back', () => {
    let thrown: unknown;
    try {
      tokenAfterRefresh(authenticatedToken, {});
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AuthApiError);
    expect(tokenAfterRefreshError(authenticatedToken, thrown).error).toBe(
      'RefreshFailed',
    );
  });
});

describe('sessionFromToken', () => {
  it('returns the authenticated session without user data', () => {
    const session = sessionFromToken(authenticatedToken, EXPIRES);

    expect(session).toEqual({ ...authenticatedToken, expires: EXPIRES });
    expect(session).not.toHaveProperty('user');
  });

  it('passes a refresh error through to the client', () => {
    const session = sessionFromToken(
      { ...authenticatedToken, error: 'RefreshFailed' },
      EXPIRES,
    );

    expect(session.isAuthenticated).toBe(true);
    expect(session.error).toBe('RefreshFailed');
  });

  it('returns an unauthenticated session for an invalid refresh token', () => {
    const session = sessionFromToken(
      { isAuthenticated: false, error: 'RefreshTokenInvalid' },
      EXPIRES,
    );

    expect(session).toEqual({
      expires: EXPIRES,
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    });
  });

  it('returns the pending MFA state', () => {
    const session = sessionFromToken(
      {
        isAuthenticated: false,
        mfaActive: true,
        mfaMethod: 'email',
        loginToken: 'login-1',
      },
      EXPIRES,
    );

    expect(session).toEqual({
      expires: EXPIRES,
      isAuthenticated: false,
      mfaActive: true,
      mfaMethod: 'email',
      loginToken: 'login-1',
    });
  });

  it.each<[string, Session]>([
    ['an empty token', {}],
    [
      'an authenticated token without an access token',
      { isAuthenticated: true },
    ],
    ['an access token without authentication', { accessToken: 'a' }],
  ])('never throws, and is unauthenticated, for %s', (_, token) => {
    expect(() => sessionFromToken(token, EXPIRES)).not.toThrow();
    expect(sessionFromToken(token, EXPIRES).isAuthenticated).toBe(false);
  });
});
