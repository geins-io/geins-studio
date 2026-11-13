// cutover: reads the session cookie next-auth wrote before the sealed session,
// so nobody is logged out by the switch. Remove it, and AUTH_SECRET, once the
// old cookies have expired or been migrated (next-auth's maxAge is 30 days).
import { hkdfSync } from 'node:crypto';
import { deleteCookie, parseCookies, type H3Event } from 'h3';
import { jwtDecrypt, type JWTPayload } from 'jose';
import { allowedAccount, tokenExpiry } from './geins-token';
import type { GeinsSession } from './sealed-session';

// next-auth 4 adds `__Secure-` on an https base URL, and splits a value over
// 4 KB into `<name>.0`, `<name>.1`, …
const SESSION_TOKEN_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
];
// Every cookie next-auth sets: session token, csrf token, callback URL.
const NEXT_AUTH_COOKIE = /^(?:__Secure-|__Host-)?next-auth\./;
// next-auth 4's `getDerivedEncryptionKey` (next-auth/jwt).
const ENCRYPTION_INFO = 'NextAuth.js Generated Encryption Key';

/** The next-auth session token in a request's cookies, chunks joined. */
export function legacySessionToken(
  cookies: Record<string, string>,
): string | undefined {
  for (const name of SESSION_TOKEN_NAMES) {
    if (cookies[name]) return cookies[name];
    const chunks = Object.entries(cookies)
      .map(([cookie, value]) => {
        const index = cookie.startsWith(`${name}.`)
          ? Number(cookie.slice(name.length + 1))
          : Number.NaN;
        return [index, value] as const;
      })
      .filter(([index]) => Number.isInteger(index))
      .sort(([a], [b]) => a - b);
    if (chunks.length) return chunks.map(([, value]) => value).join('');
  }
  return undefined;
}

/**
 * Decrypts a next-auth 4 session token: a JWE with `alg: dir`,
 * `enc: A256GCM`, keyed by HKDF-SHA256 over the auth secret. `undefined` if
 * it's tampered, expired or encrypted with another secret.
 */
export async function decryptLegacySessionToken(
  token: string,
  secret: string,
): Promise<JWTPayload | undefined> {
  try {
    const key = new Uint8Array(
      hkdfSync('sha256', secret, '', ENCRYPTION_INFO, 32),
    );
    const { payload } = await jwtDecrypt(token, key, {
      clockTolerance: 15,
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
    });
    return payload;
  } catch {
    return undefined;
  }
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

/**
 * The sealed session for a next-auth payload, as the old jwt callback stored
 * it, or `undefined` when it holds no usable tokens (signed out, mid-MFA,
 * `RefreshTokenInvalid`). The account is kept only if the token allows it.
 */
export function sessionFromLegacy(
  payload: JWTPayload,
): GeinsSession | undefined {
  const accessToken = text(payload.accessToken);
  const tokenExpires = accessToken && tokenExpiry(accessToken);
  if (payload.isAuthenticated !== true || !accessToken || !tokenExpires) {
    return undefined;
  }
  return {
    user: {},
    accountKey: allowedAccount(accessToken, text(payload.accountKey)),
    tokenExpires,
    secure: { accessToken, refreshToken: text(payload.refreshToken) },
  };
}

/**
 * The request's next-auth session: `undefined` without one, `{}` when it
 * can't be read or holds no tokens, else the session to seal.
 */
export async function readLegacySession(
  event: H3Event,
  secret: string | undefined,
): Promise<GeinsSession | undefined> {
  const token = legacySessionToken(parseCookies(event));
  if (!token) return undefined;
  const payload = secret
    ? await decryptLegacySessionToken(token, secret)
    : undefined;
  return (payload && sessionFromLegacy(payload)) || {};
}

/** Deletes every next-auth cookie the request carries, chunks included. */
export function clearLegacyCookies(event: H3Event): void {
  for (const name of Object.keys(parseCookies(event))) {
    if (!NEXT_AUTH_COOKIE.test(name)) continue;
    // A `__Secure-`/`__Host-` cookie only goes away with `secure`.
    deleteCookie(event, name, { path: '/', secure: name.startsWith('__') });
  }
}
