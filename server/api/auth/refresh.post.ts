import { defineEventHandler, readBody } from 'h3';
import {
  forceRefreshSession,
  toClientSession,
} from '../../utils/geins-session';

/**
 * Forces a refresh after the API answered 401 to an expired or rejected token
 * (body: `ForceRefreshRequest`). Under the client's Web Lock, like the
 * session read.
 */
export default defineEventHandler(async (event) =>
  toClientSession(await forceRefreshSession(event, await readBody(event))),
);
