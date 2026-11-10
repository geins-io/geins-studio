import { createError, type H3Event } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import type { AuthResponse, Session, TokenSession } from '#shared/types';
import {
  refreshWithRetry,
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

// One Geins refresh per refresh token per server instance: parallel proxy
// calls in one lambda must not each rotate the same token.
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
    pending = refreshWithRetry(geinsAuth.refresh, refreshToken, {
      onRetry: (status, attempt) =>
        geinsLogWarn(
          `refresh answered ${status}, retrying (attempt ${attempt})`,
        ),
    }).finally(() => inflight.delete(refreshToken));
    inflight.set(refreshToken, pending);
  }
  return pending;
};

/**
 * Refreshes with Geins and rewrites the cookie on this response. Never throws:
 * a failure lands in `session.error`, by the same rules as `tokenAfterRefreshError`.
 * Only a `mayDowngrade` caller writes a failure; anyone else keeps the session.
 */
async function refreshSession(
  event: H3Event,
  session: GeinsSession,
  mayDowngrade: boolean,
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
    // A proxy call never writes a failure: a parallel call on another
    // instance may have just rotated the token, and the browser keeps the
    // last cookie it gets. Only the session routes, under the client's Web
    // Lock, decide.
    if (!mayDowngrade) return session;
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

/**
 * The session, refreshed first when the access token is expired or close to
 * it. `mayDowngrade` only for the session routes, which run under the
 * client's Web Lock; the API proxy never writes a failed refresh.
 */
export async function readGeinsSession(
  event: H3Event,
  { mayDowngrade = false }: { mayDowngrade?: boolean } = {},
): Promise<GeinsSession> {
  let session = await readSealedSession(event);
  if (Object.keys(session).length === 0) {
    session = (await migrateLegacySession(event)) ?? session;
  }
  if (
    session.user &&
    session.secure?.refreshToken &&
    geinsAuth.shouldRefresh(toTokenSession(session))
  ) {
    return refreshSession(event, session, mayDowngrade);
  }
  return session;
}

/**
 * Refreshes now, after the API answered 401 to a token that hasn't expired.
 * Only while the cookie still holds the rejected token: if another tab
 * already rotated it, that new token is returned instead.
 */
export async function forceRefreshSession(
  event: H3Event,
  request: unknown,
): Promise<GeinsSession> {
  const session = await readGeinsSession(event, { mayDowngrade: true });
  if (!shouldForceRefresh(toTokenSession(session), request)) {
    return session;
  }
  geinsLogWarn('the API rejected the token, forcing a refresh');
  return refreshSession(event, session, true);
}
