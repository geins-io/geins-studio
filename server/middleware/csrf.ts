import { createError, defineEventHandler, getHeader, getRequestHost } from 'h3';
import { CSRF_HEADER, csrfRejection } from '#shared/utils/csrf';
import { log } from '#shared/utils/log';

// The browser posts CSP reports itself, without our header.
const EXEMPT_PATHS = new Set(['/api/csp-report']);

// cutover: next-auth's client can't send our header, and next-auth guards its
// own POSTs with a double-submit CSRF token. Goes with the sealed session.
const EXEMPT_PREFIX = '/api/auth/';

/** Every state-changing `/api` call must come from Studio itself. */
export default defineEventHandler((event) => {
  const path = (event.path.split('?')[0] ?? '').toLowerCase();
  if (!path.startsWith('/api/')) return;
  if (EXEMPT_PATHS.has(path) || path.startsWith(EXEMPT_PREFIX)) return;
  const reason = csrfRejection({
    method: event.method,
    host: getRequestHost(event, { xForwardedHost: true }),
    secFetchSite: getHeader(event, 'sec-fetch-site'),
    origin: getHeader(event, 'origin'),
    csrfHeader: getHeader(event, CSRF_HEADER),
  });
  if (reason) {
    log('server/middleware/csrf.ts').geinsLogWarn(
      `${event.method} ${path}: ${reason}`,
    );
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
});
