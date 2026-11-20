// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { TokenSession } from '#shared/types';
import {
  AuthApiError,
  shouldForceRefresh,
  tokenAfterRefresh,
  tokenAfterRefreshError,
} from '../auth-session';

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
const fakeJwt = (payload: { exp: number; iat: number }) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;

const authenticatedToken: TokenSession = {
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

    expect(next).toEqual({
      isAuthenticated: false,
      error: 'RefreshTokenInvalid',
    });
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

describe('shouldForceRefresh', () => {
  const forceRefresh = {
    rejectedTokenExpires: authenticatedToken.tokenExpires,
  };

  it('forces a refresh of the rejected token', () => {
    expect(shouldForceRefresh(authenticatedToken, forceRefresh)).toBe(true);
  });

  it("doesn't refresh a token another tab already rotated", () => {
    expect(
      shouldForceRefresh(authenticatedToken, { rejectedTokenExpires: 1500 }),
    ).toBe(false);
  });

  it.each([
    ['no body', undefined],
    ['other data', { accountKey: 'account-2' }],
    ['no expiry', { rejectedTokenExpires: undefined }],
    ['an expiry that is not a number', { rejectedTokenExpires: '2000' }],
  ])("doesn't refresh on %s", (_, body) => {
    expect(shouldForceRefresh(authenticatedToken, body)).toBe(false);
  });

  it("doesn't refresh a session without tokens", () => {
    expect(
      shouldForceRefresh(
        { isAuthenticated: false, error: 'RefreshTokenInvalid' },
        { rejectedTokenExpires: undefined },
      ),
    ).toBe(false);
  });
});
