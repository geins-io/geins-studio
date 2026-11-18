import { createError } from 'h3';
import { AuthApiError } from '#shared/utils/auth-session';

/**
 * The status an auth route answers for a failed Geins call: `429` passes
 * through (the login page says to wait), any other `4xx` is a plain `401`,
 * and everything else (5xx, network, timeout) is a `502`.
 */
export function authRouteError(error: unknown) {
  const status = error instanceof AuthApiError ? error.status : 0;
  if (status === 429) {
    return createError({ statusCode: 429, statusMessage: 'Too many attempts' });
  }
  if (status >= 400 && status < 500) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  return createError({
    statusCode: 502,
    statusMessage: 'Auth service unavailable',
  });
}
