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
 * `cookie` carries the sealed session with the tokens, `host` and
 * `x-forwarded-*` describe the hop to Studio, and `content-length` is set by
 * fetch from the body it actually sends. `authorization` and `x-account-key`
 * come from the session, never from the browser.
 */
export const UPSTREAM_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'idempotency-key',
  'if-match',
  'x-app',
] as const;

/** What the proxy sends on the session's behalf. */
export interface UpstreamAuth {
  accessToken?: string;
  accountKey?: string;
}

/**
 * Proxy side: build the backend request headers from the browser's. Keeps
 * {@link UPSTREAM_HEADERS} only, restores `If-Match`, and adds the session's
 * token as a Bearer `authorization` with its `x-account-key`. Expects lowercase
 * header names, as h3's `getHeaders` returns them.
 */
export function pickUpstreamHeaders(
  headers: Record<string, string | undefined>,
  auth: UpstreamAuth = {},
): Record<string, string> {
  const restored = { ...headers };
  restoreIfMatch(restored);
  const upstream: Record<string, string> = {};
  for (const name of UPSTREAM_HEADERS) {
    const value = restored[name];
    if (value !== undefined) upstream[name] = value;
  }
  if (auth.accessToken) {
    upstream.authorization = `Bearer ${auth.accessToken}`;
    if (auth.accountKey) upstream['x-account-key'] = auth.accountKey;
  }
  return upstream;
}

/**
 * Whether a proxied path reaches Geins' own auth endpoints (`auth`,
 * `auth/refresh`, …), which answer with tokens. The proxy never forwards to
 * them; Studio's auth routes call them server-side. Decoded and resolved
 * first, so `x/../auth` or `%61uth` can't slip past; unparsable counts as auth.
 */
export const isGeinsAuthPath = (path: string): boolean => {
  let resolved: string;
  try {
    resolved = new URL(decodeURIComponent(path), 'http://geins/').pathname;
  } catch {
    return true;
  }
  return /^\/auth(?:\/|$)/i.test(resolved);
};
