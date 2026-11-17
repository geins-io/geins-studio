import { createError, type H3Event } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import type { AuthResponse, Session, TokenSession } from '#shared/types';
import {
  shouldForceRefresh,
  tokenAfterRefresh,
  tokenAfterRefreshError,
} from '#shared/utils/auth-session';
import { log } from '#shared/utils/log';
import { auth } from './auth';
import { allowedAccount, tokenExpiry } from './geins-token';
import { clearLegacyCookies, readLegacySession } from './legacy-session';
import {
  readSealedSession,
  writeSealedSession,
  type GeinsSession,
} from './sealed-session';

const geinsAuth = auth();
const { geinsLog, geinsLogWarn } = log('server/utils/geins-session.ts');

// Geins refresh tokens slide: each refresh gives 7 more days, with no cap.
export const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;
// The Geins MFA login token lives 5 minutes.
export const MFA_MAX_AGE_S = 5 * 60;

// One Geins refresh per refresh token per server instance, for tabs without
// Web Locks, whose session reads aren't serialized.
const inflight = new Map<string, Promise<AuthResponse>>();

/** What the browser sees: never a token. */
export const toClientSession = (session: GeinsSession): Session => ({
  isAuthenticated: !!session.user && !!session.secure?.accessToken,
  accountKey: session.accountKey,
  tokenExpires: session.tokenExpires,
  mfaActive: !!session.mfa,
  mfaMethod: session.mfa?.method,
  ...(session.error && { error: session.error }),
});

const toTokenSession = (session: GeinsSession): TokenSession => ({
  isAuthenticated: !!session.user && !!session.secure?.accessToken,
  accessToken: session.secure?.accessToken,
  refreshToken: session.secure?.refreshToken,
  accountKey: session.accountKey,
  tokenExpires: session.tokenExpires,
});

/** What the login page needs to do next. */
export interface AuthStep {
  mfaRequired: boolean;
  mfaMethod?: string;
  accountRequired: boolean;
}

/**
 * Stores a Geins login or verify response in the session. An MFA challenge
 * keeps only the login token, for its 5 minutes. Tokens pick the account
 * themselves when the user has exactly one.
 */
export async function storeAuthResponse(
  event: H3Event,
  response: AuthResponse,
): Promise<AuthStep> {
  if (response.mfaRequired && response.loginToken) {
    await writeSealedSession(
      event,
      {
        mfa: { method: response.mfaMethod },
        secure: { loginToken: response.loginToken },
      },
      MFA_MAX_AGE_S,
    );
    return {
      mfaRequired: true,
      mfaMethod: response.mfaMethod,
      accountRequired: false,
    };
  }
  const tokenExpires =
    response.accessToken && tokenExpiry(response.accessToken);
  if (!response.accessToken || !tokenExpires) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  const onlyAccount =
    response.accounts?.length === 1
      ? response.accounts[0]?.accountKey
      : undefined;
  const accountKey = allowedAccount(
    response.accessToken,
    response.accountKey ?? onlyAccount,
  );
  await writeSealedSession(
    event,
    {
      user: {},
      accountKey,
      tokenExpires,
      secure: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
    },
    SESSION_MAX_AGE_S,
  );
  return { mfaRequired: false, accountRequired: !accountKey };
}

const refreshOnce = (refreshToken: string): Promise<AuthResponse> => {
  let pending = inflight.get(refreshToken);
  if (!pending) {
    pending = geinsAuth
      .refresh(refreshToken)
      .finally(() => inflight.delete(refreshToken));
    inflight.set(refreshToken, pending);
  }
  return pending;
};

/**
 * Refreshes with Geins and writes the outcome into the cookie on this response.
 * Never throws: a failure lands in `session.error`, by the same rules as
 * `tokenAfterRefreshError`.
 *
 * Only the session routes get here, and the client calls them under its
 * `geins-auth-refresh` Web Lock. Geins refuses a second concurrent refresh
 * with one token (403), so a refresh anywhere else, such as the API proxy on
 * another instance, could race them and leave a dead session in the cookie.
 */
async function refreshSession(
  event: H3Event,
  session: GeinsSession,
): Promise<GeinsSession> {
  const token = toTokenSession(session);
  let next: TokenSession;
  try {
    next = tokenAfterRefresh(
      token,
      await refreshOnce(token.refreshToken ?? ''),
    );
  } catch (error) {
    next = tokenAfterRefreshError(token, error);
    geinsLogWarn(
      `refresh failed (${next.error}):`,
      error instanceof Error ? error.message : error,
    );
    if (next.error === 'RefreshTokenInvalid') {
      // Tokens dropped; the flag stays so the client re-checks, then logs out.
      return writeSealedSession(
        event,
        { error: 'RefreshTokenInvalid' },
        SESSION_MAX_AGE_S,
      );
    }
    return writeSealedSession(
      event,
      { ...session, error: 'RefreshFailed' },
      SESSION_MAX_AGE_S,
    );
  }
  geinsLog('session refreshed, expires:', next.tokenExpires);
  return writeSealedSession(
    event,
    {
      user: {},
      // Removed from the account since the last refresh: pick again.
      accountKey: allowedAccount(next.accessToken, session.accountKey),
      tokenExpires: next.tokenExpires,
      secure: {
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
      },
    },
    SESSION_MAX_AGE_S,
  );
}

// cutover: a request with no sealed session may still carry next-auth's.
async function migrateLegacySession(
  event: H3Event,
): Promise<GeinsSession | undefined> {
  const legacy = await readLegacySession(
    event,
    useRuntimeConfig(event).private.authSecret,
  );
  if (!legacy) return undefined;
  clearLegacyCookies(event);
  if (!legacy.secure) {
    geinsLogWarn('a next-auth session could not be migrated');
    return undefined;
  }
  geinsLog('migrated a next-auth session');
  return writeSealedSession(event, legacy, SESSION_MAX_AGE_S);
}

/** The stored session; a next-auth cookie on its own is migrated first. */
async function readStoredSession(event: H3Event): Promise<GeinsSession> {
  const session = await readSealedSession(event);
  if (Object.keys(session).length > 0) return session;
  return (await migrateLegacySession(event)) ?? session;
}

const isDue = (session: GeinsSession): boolean =>
  !!session.user &&
  !!session.secure?.refreshToken &&
  geinsAuth.shouldRefresh(toTokenSession(session));

/**
 * `GET /api/auth/session`: the session, refreshed first when the access token
 * is expired or expires within 5 minutes.
 */
export async function refreshSessionIfDue(
  event: H3Event,
): Promise<GeinsSession> {
  const session = await readStoredSession(event);
  return isDue(session) ? refreshSession(event, session) : session;
}

/**
 * `POST /api/auth/refresh`, after the API answered 401: refreshes now, even
 * before the token is due, but only while the cookie still holds the rejected
 * token. If another tab already rotated it, that new token is returned
 * instead. At most one Geins refresh either way.
 */
export async function forceRefreshSession(
  event: H3Event,
  request: unknown,
): Promise<GeinsSession> {
  const session = await readStoredSession(event);
  if (isDue(session)) {
    return refreshSession(event, session);
  }
  if (!shouldForceRefresh(toTokenSession(session), request)) {
    return session;
  }
  geinsLogWarn('the API rejected the token, forcing a refresh');
  return refreshSession(event, session);
}
