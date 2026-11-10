import {
  createError,
  deleteCookie,
  parseCookies,
  setCookie,
  type H3Event,
} from 'h3';
import { defaults, seal, unseal } from 'iron-webcrypto';
import { deriveSecret } from 'nuxt/server';
import type { AuthSessionError } from '#shared/types';
import { log } from '#shared/utils/log';

// Named apart from h3's auto-imported `sealSession`/`clearSession`/….

/**
 * The server's session. Only `toClientSession` (geins-session.ts) decides what
 * of it the browser sees; `secure` never leaves the server.
 */
export interface GeinsSession {
  /** Present once Geins has issued tokens. The profile comes from `user/me`. */
  user?: Record<string, never>;
  accountKey?: string;
  /** The access token's `exp`, in seconds. */
  tokenExpires?: number;
  mfa?: { method?: string };
  error?: AuthSessionError;
  secure?: { accessToken?: string; refreshToken?: string; loginToken?: string };
}

export const SESSION_COOKIE = 'geins-session';
// Browsers cap one cookie at 4096 bytes, name and attributes included.
export const CHUNK_SIZE = 3800;
// Node rejects a request whose headers pass 16 KB in total (431) before any
// handler runs, so a session that fills 4 chunks would lock its user out of
// every request, logout included. 3 chunks (~11.4 KB) leave room for the
// other cookies and headers; a bigger session is refused when it's written.
export const MAX_CHUNKS = 3;

const CHUNK_NAME = new RegExp(`^${SESSION_COOKIE}\\.(\\d+)$`);

/** The chunk index of a session cookie name, or `undefined` for any other. */
export const chunkIndex = (name: string): number | undefined => {
  const match = CHUNK_NAME.exec(name);
  return match ? Number(match[1]) : undefined;
};

const chunkEntries = (cookies: Record<string, string>) =>
  Object.entries(cookies)
    .map(([name, value]) => [chunkIndex(name), value] as const)
    .filter(
      (entry): entry is readonly [number, string] => entry[0] !== undefined,
    )
    .sort(([a], [b]) => a - b);

/** The session's chunk values from a request's cookies, in index order. */
export const sessionChunks = (cookies: Record<string, string>): string[] =>
  chunkEntries(cookies).map(([, value]) => value);

/** One past the highest chunk index the request carries: what a write must cover. */
export const chunkSpan = (cookies: Record<string, string>): number =>
  chunkEntries(cookies).reduce((span, [index]) => Math.max(span, index + 1), 0);

export const splitIntoChunks = (sealed: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < sealed.length; i += CHUNK_SIZE) {
    chunks.push(sealed.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

export const sealSessionValue = (
  session: GeinsSession,
  password: string,
  maxAgeSeconds: number,
): Promise<string> =>
  seal(session, password, { ...defaults, ttl: maxAgeSeconds * 1000 });

/** The sealed session, or an empty one if it's tampered, expired or sealed with another secret. */
export const unsealSessionValue = async (
  sealed: string,
  password: string,
): Promise<GeinsSession> => {
  if (!sealed) return {};
  try {
    const value = await unseal(sealed, password, defaults);
    return value && typeof value === 'object' ? (value as GeinsSession) : {};
  } catch {
    return {};
  }
};

const password = () => deriveSecret('geins-session');

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: !import.meta.dev,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

declare module 'h3' {
  interface H3EventContext {
    /** The session as this request last read or wrote it. */
    geinsSession?: GeinsSession;
    /** How many chunks the browser holds once this response lands. */
    geinsSessionChunks?: number;
    /** A Geins refresh already ran in this request. */
    geinsRefreshed?: boolean;
  }
}

const heldChunks = (event: H3Event): number =>
  event.context.geinsSessionChunks ?? chunkSpan(parseCookies(event));

/** The session, cached on the event so reads and writes in one request agree. */
export async function readSealedSession(event: H3Event): Promise<GeinsSession> {
  const cached = event.context.geinsSession;
  if (cached) return cached;
  const sealed = sessionChunks(parseCookies(event)).join('');
  const session = await unsealSessionValue(sealed, await password());
  event.context.geinsSession = session;
  return session;
}

export async function writeSealedSession(
  event: H3Event,
  session: GeinsSession,
  maxAge: number,
): Promise<GeinsSession> {
  const sealed = await sealSessionValue(session, await password(), maxAge);
  const chunks = splitIntoChunks(sealed);
  if (chunks.length > MAX_CHUNKS) {
    log('server/utils/sealed-session.ts').geinsLogError(
      `session too large: ${sealed.length} B in ${chunks.length} chunks`,
    );
    throw createError({ statusCode: 500, statusMessage: 'Session too large' });
  }
  const held = heldChunks(event);
  chunks.forEach((chunk, i) =>
    setCookie(event, `${SESSION_COOKIE}.${i}`, chunk, cookieOptions(maxAge)),
  );
  for (let i = chunks.length; i < held; i++) {
    deleteCookie(event, `${SESSION_COOKIE}.${i}`, cookieOptions(0));
  }
  event.context.geinsSession = session;
  event.context.geinsSessionChunks = chunks.length;
  return session;
}

export function clearSealedSession(event: H3Event): void {
  const held = heldChunks(event);
  for (let i = 0; i < held; i++) {
    deleteCookie(event, `${SESSION_COOKIE}.${i}`, cookieOptions(0));
  }
  event.context.geinsSession = {};
  event.context.geinsSessionChunks = 0;
}
