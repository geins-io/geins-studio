import { defineEventHandler } from 'h3';
import {
  refreshSessionIfDue,
  toClientSession,
} from '../../utils/geins-session';

/**
 * The client's session read, under its `geins-auth-refresh` Web Lock: refreshes
 * when due. Never a token.
 */
export default defineEventHandler(async (event) =>
  toClientSession(await refreshSessionIfDue(event)),
);
