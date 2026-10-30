// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { Session } from '#shared/types';
import {
  AuthApiError,
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

  it.each([404, 429])('keeps the session on a %i', (status) => {
    const next = tokenAfterRefreshError(
      authenticatedToken,
      new AuthApiError(status, 'Nope'),
    );

    expect(next.error).toBe('RefreshFailed');
    expect(next.refreshToken).toBe('refresh-1');
  });

  it('keeps the session on an error without a status', () => {
    const next = tokenAfterRefreshError(authenticatedToken, new Error('boom'));

    expect(next.error).toBe('RefreshFailed');
    expect(next.isAuthenticated).toBe(true);
  });

  it.each([401, 403])(
    'marks the refresh token invalid and drops the tokens on a %i',
    (status) => {
      const next = tokenAfterRefreshError(
        authenticatedToken,
        new AuthApiError(status, 'Unauthorized'),
      );

      expect(next).toEqual({
        isAuthenticated: false,
        error: 'RefreshTokenInvalid',
      });
    },
  );
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
