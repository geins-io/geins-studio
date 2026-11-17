import { createError, defineEventHandler, getHeader, getRequestHost } from 'h3';
import { CSRF_HEADER, csrfRejection, isGuardedPath } from '#shared/utils/csrf';
import { log } from '#shared/utils/log';

/** Every state-changing `/api` call must come from Studio itself. */
export default defineEventHandler((event) => {
  const path = (event.path.split('?')[0] ?? '').toLowerCase();
  if (!isGuardedPath(path)) return;
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
