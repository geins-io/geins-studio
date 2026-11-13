import { defineEventHandler, sendNoContent } from 'h3';
import { AuthApiError } from '#shared/utils/auth-session';
import { log } from '#shared/utils/log';
import { auth } from '../../utils/auth';
import {
  clearSealedSession,
  readSealedSession,
} from '../../utils/sealed-session';

const { geinsLogWarn } = log('server/api/auth/logout.post.ts');

// Logout waits this long for Geins at most. Awaited, because a serverless
// function may be frozen once it has answered; past the wait, the revoke runs
// on to its own timeout where the runtime lets it.
export const REVOKE_WAIT_MS = 3_000;

// Status or error name only: a log line must never risk carrying the token.
const revokeFailure = (error: unknown): string => {
  if (!(error instanceof AuthApiError)) {
    return `unexpected ${error instanceof Error ? error.name : 'error'}`;
  }
  return error.isNetworkError
    ? 'network error or timeout'
    : `Geins answered ${error.status}`;
};

const revokeQuietly = async (refreshToken: string): Promise<void> => {
  try {
    await auth().revoke(refreshToken);
  } catch (error) {
    geinsLogWarn(`refresh token not revoked: ${revokeFailure(error)}`);
  }
};

/**
 * Revokes the session's refresh token with Geins, best-effort, then drops the
 * session cookies. A failed or slow revoke never blocks the logout. Access
 * tokens can't be revoked: one already issued stays valid until its `exp`.
 */
export default defineEventHandler(async (event) => {
  // The cookie as it is, not `readGeinsSession`: a refresh first would only
  // rotate the token this is about to revoke.
  const refreshToken = (await readSealedSession(event)).secure?.refreshToken;
  if (refreshToken) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const waited = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), REVOKE_WAIT_MS);
    });
    const outcome = await Promise.race([revokeQuietly(refreshToken), waited]);
    clearTimeout(timer);
    if (outcome === 'timeout') {
      geinsLogWarn(
        `refresh token revoke not answered within ${REVOKE_WAIT_MS} ms`,
      );
    }
  }
  clearSealedSession(event);
  return sendNoContent(event);
});
