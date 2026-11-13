import { defineEventHandler, readBody } from 'h3';
import {
  forceRefreshSession,
  toClientSession,
} from '../../utils/geins-session';

/**
 * Forces a refresh after the API answered 401 to a token that hasn't expired
 * (body: `ForceRefreshRequest`). Under the client's Web Lock, like the
 * session read, so it may write a failed refresh.
 */
export default defineEventHandler(async (event) =>
  toClientSession(await forceRefreshSession(event, await readBody(event))),
);
