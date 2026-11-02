/**
 * Vercel's edge evaluates a request's `If-Match` against the function's own
 * response and replaces it with a 412 (`x-vercel-error: PRECONDITION_FAILED`),
 * even when the upstream write succeeded. So the browser sends the etag under
 * this header instead, and the API proxy restores `If-Match` toward the backend.
 */
export const IF_MATCH_PROXY_HEADER = 'x-geins-if-match';

/** Browser side: move `If-Match` to {@link IF_MATCH_PROXY_HEADER}. */
export function tunnelIfMatch(headers: Headers): void {
  const value = headers.get('if-match');
  if (value === null) return;
  headers.set(IF_MATCH_PROXY_HEADER, value);
  headers.delete('if-match');
}

/**
 * Proxy side: restore `If-Match` from {@link IF_MATCH_PROXY_HEADER}. Expects
 * lowercase header names, as h3's `getHeaders` returns them.
 */
export function restoreIfMatch(
  headers: Record<string, string | undefined>,
): void {
  const value = headers[IF_MATCH_PROXY_HEADER];
  if (value === undefined) return;
  headers['if-match'] = value;
  Reflect.deleteProperty(headers, IF_MATCH_PROXY_HEADER);
}

/**
 * The browser headers the API proxy passes on to the backend; a header the
 * backend needs must be listed here. Everything else stays at the proxy:
 * `cookie` carries the session's access and refresh tokens, `host` and
 * `x-forwarded-*` describe the hop to Studio, and `content-length` is set by
 * fetch from the body it actually sends.
 */
export const UPSTREAM_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'if-match',
  'x-account-key',
  'x-app',
] as const;

/**
 * Proxy side: build the backend request headers from the browser's. Keeps
 * {@link UPSTREAM_HEADERS} only, restores `If-Match`, and sends
 * `x-access-token` as a Bearer `authorization`. Expects lowercase header names,
 * as h3's `getHeaders` returns them.
 */
export function pickUpstreamHeaders(
  headers: Record<string, string | undefined>,
): Record<string, string> {
  const restored = { ...headers };
  restoreIfMatch(restored);
  const upstream: Record<string, string> = {};
  for (const name of UPSTREAM_HEADERS) {
    const value = restored[name];
    if (value !== undefined) upstream[name] = value;
  }
  const token = headers['x-access-token'];
  if (token) upstream.authorization = `Bearer ${token}`;
  return upstream;
}
