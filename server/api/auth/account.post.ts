import { createError, defineEventHandler, readBody } from 'h3';
import {
  readGeinsSession,
  SESSION_MAX_AGE_S,
  toClientSession,
} from '../../utils/geins-session';
import { tokenAllowsAccount } from '../../utils/geins-token';
import { writeSealedSession } from '../../utils/sealed-session';

/**
 * Picks the account, at login and from the sidebar switcher. Checked against
 * the token's own account claims, which every Geins service checks too, so the
 * proxy can send the stored key without asking again.
 */
export default defineEventHandler(async (event) => {
  const { accountKey } =
    (await readBody<{ accountKey?: unknown }>(event)) ?? {};
  const session = await readGeinsSession(event);
  const accessToken = session.secure?.accessToken;
  if (!session.user || !accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  if (typeof accountKey !== 'string' || !accountKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing account key',
    });
  }
  if (!tokenAllowsAccount(accessToken, accountKey)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not a member of this account',
    });
  }
  return toClientSession(
    await writeSealedSession(
      event,
      { ...session, accountKey },
      SESSION_MAX_AGE_S,
    ),
  );
});
