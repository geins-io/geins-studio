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
