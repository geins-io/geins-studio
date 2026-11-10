import { defineEventHandler, sendNoContent } from 'h3';
import { clearSealedSession } from '../../utils/sealed-session';

/**
 * Drops the session cookies. Geins has no endpoint to revoke a refresh token
 * yet, so the token itself stays valid until it expires.
 */
export default defineEventHandler((event) => {
  clearSealedSession(event);
  return sendNoContent(event);
});
