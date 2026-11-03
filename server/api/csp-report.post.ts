import { defineEventHandler, getHeader, readRawBody, sendNoContent } from 'h3';
import { log } from '#shared/utils/log';
import { parseCspReports } from '#shared/utils/security-headers';

const MAX_BODY_BYTES = 64 * 1024;

/**
 * Collects report-only CSP violations into the server log (Vercel / Azure).
 * Unauthenticated by nature — browsers post here without credentials — so it
 * reads a capped body, logs a trimmed summary and always answers 204.
 */
export default defineEventHandler(async (event) => {
  const length = Number(getHeader(event, 'content-length'));
  if (length > 0 && length <= MAX_BODY_BYTES) {
    let payload: unknown;
    try {
      payload = JSON.parse((await readRawBody(event, 'utf8')) ?? '');
    } catch {
      payload = undefined;
    }
    const { geinsLogWarn } = log('csp-report');
    for (const v of parseCspReports(payload)) {
      geinsLogWarn(
        `CSP report-only: ${v.directive} blocked ${v.blockedUrl || '?'} on ${v.documentUrl || '?'}` +
          (v.sourceFile ? ` (${v.sourceFile}:${v.line ?? '?'})` : '') +
          (v.sample ? ` sample="${v.sample}"` : ''),
      );
    }
  }
  return sendNoContent(event);
});
