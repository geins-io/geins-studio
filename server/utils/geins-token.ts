import { jwtDecode } from 'jwt-decode';

interface GeinsClaims {
  exp?: number;
  'geins:accountkey'?: string | string[];
  'geins:role'?: string | string[];
}

const SUPER_ADMIN = 'Super Admin';

const toList = (value?: string | string[]): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const claimsOf = (accessToken: string): GeinsClaims | undefined => {
  try {
    return jwtDecode<GeinsClaims>(accessToken);
  } catch {
    return undefined;
  }
};

/**
 * Whether the access token may use `accountKey`, by the claims every Geins
 * service checks: the key is in `geins:accountkey`, or `geins:role` holds the
 * global Super Admin role (those tokens carry no account claims at all).
 * Decoded, not verified: the token came from Geins, and Geins verifies it on
 * every call.
 */
export function tokenAllowsAccount(
  accessToken: string,
  accountKey: string,
): boolean {
  const claims = claimsOf(accessToken);
  if (!claims || !accountKey) return false;
  return (
    toList(claims['geins:role']).includes(SUPER_ADMIN) ||
    toList(claims['geins:accountkey']).includes(accountKey)
  );
}

/** The access token's `exp`, in seconds, or `undefined` if it has none. */
export function tokenExpiry(accessToken: string): number | undefined {
  const exp = claimsOf(accessToken)?.exp;
  return typeof exp === 'number' ? exp : undefined;
}

/** `accountKey`, if the token may use it. */
export const allowedAccount = (
  accessToken: string | undefined,
  accountKey: string | undefined,
): string | undefined =>
  accessToken && accountKey && tokenAllowsAccount(accessToken, accountKey)
    ? accountKey
    : undefined;
