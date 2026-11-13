import { defineEventHandler } from 'h3';
import { readGeinsSession, toClientSession } from '../../utils/geins-session';

/**
 * The client's session read, under its `geins-auth-refresh` Web Lock: refreshes
 * when due, and is the one place a failed refresh is written. Never a token.
 */
export default defineEventHandler(async (event) =>
  toClientSession(await readGeinsSession(event, { mayDowngrade: true })),
);
