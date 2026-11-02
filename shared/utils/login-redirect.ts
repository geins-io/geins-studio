/**
 * The login page URL that brings the user back to `fullPath` afterwards.
 * `fullPath` is encoded whole, so its own query (`?status=sent&page=2`) stays
 * inside the `redirect` param instead of splitting into the login URL's query.
 */
export function loginUrl(fullPath: string): string {
  return fullPath === '/'
    ? '/auth/login'
    : `/auth/login?redirect=${encodeURIComponent(fullPath)}`;
}

/**
 * The in-app path to go to after login, from the login page's `redirect` query
 * param. Only a path with a single leading `/` is kept; anything else falls
 * back to `/`. Browsers read `\` as `/` and drop tabs and newlines in URLs, so
 * `/\host` or `/<tab>/host` would become the protocol-relative `//host`.
 * Vue Router refuses cross-origin pushes today, but nothing here relies on it.
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\\\s]/.test(value)) return '/';
  return value;
}
