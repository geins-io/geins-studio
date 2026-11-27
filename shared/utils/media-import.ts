import type {
  MediaImportErrorCode,
  MediaImportFailure,
  MediaImportProbeRequest,
  MediaImportTransferRequest,
} from '#shared/types';
import { MAX_FILE_BYTES } from './asset';
import { UPLOAD_ORIGINS } from './security-headers';

/*
 * Guards for the CSV import relay (`server/api/media-import/*`). It fetches
 * user-supplied URLs server-side, so every hop is an SSRF risk: these decide
 * what it may connect to and what it may write to.
 */

export const MEDIA_IMPORT_MAX_REDIRECTS = 5;
/** Fixed: the relay never forwards the browser's headers to a source. */
export const MEDIA_IMPORT_USER_AGENT = 'GeinsStudio-MediaImport/1.0';
const MAX_URL_LENGTH = 4096;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
// A bare `type/subtype`, as it goes into the upload's Content-Type header.
const MIME_RE = /^[a-z0-9][\w!#$&^.+-]*\/[a-z0-9][\w!#$&^.+-]*$/i;

type Ipv4Range = readonly [base: string, prefix: number];

// Everything that isn't public unicast: "this network", private, CGNAT,
// loopback, link-local (the 169.254.169.254 metadata endpoint), IETF and
// documentation blocks, the 6to4 relay, benchmarking, multicast, reserved
// and broadcast.
const BLOCKED_IPV4: readonly Ipv4Range[] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function parseIpv4(text: string): number | undefined {
  const parts = text.split('.');
  if (parts.length !== 4) return undefined;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return undefined;
    const octet = Number(part);
    if (octet > 255) return undefined;
    value = value * 256 + octet;
  }
  return value;
}

const BLOCKED_IPV4_RANGES = BLOCKED_IPV4.map(
  ([base, prefix]) => [parseIpv4(base)!, prefix] as const,
);

const inIpv4Range = (ip: number, base: number, prefix: number): boolean =>
  Math.floor(ip / 2 ** (32 - prefix)) === Math.floor(base / 2 ** (32 - prefix));

const isBlockedIpv4 = (ip: number): boolean =>
  BLOCKED_IPV4_RANGES.some(([base, prefix]) => inIpv4Range(ip, base, prefix));

/** Eight 16-bit groups, or `undefined` for anything that isn't an IPv6 address. */
function parseIpv6(text: string): number[] | undefined {
  let s = text.replace(/%.*$/, '');
  if (!s.includes(':')) return undefined;
  const lastColon = s.lastIndexOf(':');
  const tail = s.slice(lastColon + 1);
  if (tail.includes('.')) {
    const v4 = parseIpv4(tail);
    if (v4 === undefined) return undefined;
    s = `${s.slice(0, lastColon + 1)}${Math.floor(v4 / 65536).toString(16)}:${(v4 % 65536).toString(16)}`;
  }
  const halves = s.split('::');
  if (halves.length > 2) return undefined;
  const split = (half: string | undefined) => (half ? half.split(':') : []);
  const head = split(halves[0]);
  const rest = split(halves[1]);
  let groups: string[];
  if (halves.length === 2) {
    if (head.length + rest.length > 7) return undefined;
    groups = [
      ...head,
      ...Array<string>(8 - head.length - rest.length).fill('0'),
      ...rest,
    ];
  } else {
    groups = head;
  }
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g)))
    return undefined;
  return groups.map((g) => parseInt(g, 16));
}

const embeddedIpv4 = (high: number, low: number): number => high * 65536 + low;

function isBlockedIpv6(h: number[]): boolean {
  const [h0 = 0, h1 = 0, h2 = 0, h3 = 0, h4 = 0, h5 = 0, h6 = 0, h7 = 0] = h;
  const zeroPrefix = h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0;
  // ::ffff:a.b.c.d (mapped) and 64:ff9b::a.b.c.d (NAT64) reach the IPv4 address.
  if (zeroPrefix && h5 === 0xffff) return isBlockedIpv4(embeddedIpv4(h6, h7));
  if (
    h0 === 0x64 &&
    h1 === 0xff9b &&
    h2 === 0 &&
    h3 === 0 &&
    h4 === 0 &&
    h5 === 0
  )
    return isBlockedIpv4(embeddedIpv4(h6, h7));
  // 6to4 (2002:a.b.c.d::/48) also tunnels to an IPv4 address.
  if (h0 === 0x2002) return isBlockedIpv4(embeddedIpv4(h1, h2));
  // Teredo and documentation sit inside the global unicast block below.
  if (h0 === 0x2001 && (h1 === 0 || h1 === 0xdb8)) return true;
  // Only global unicast (2000::/3) is public: this refuses ::, ::1, the
  // IPv4-compatible ::/96, unique-local fc00::/7, link-local fe80::/10,
  // multicast and the rest.
  return (h0 & 0xe000) !== 0x2000;
}

/**
 * Whether the relay must refuse to connect to `ip`, an IPv4 or IPv6 address
 * (brackets and a zone id are fine). Anything it can't parse is refused.
 */
export function isBlockedAddress(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, '');
  const v4 = parseIpv4(bare);
  if (v4 !== undefined) return isBlockedIpv4(v4);
  const v6 = parseIpv6(bare);
  return v6 === undefined || isBlockedIpv6(v6);
}

/**
 * A DNS answer the relay may connect to: at least one address and none
 * blocked. One private record among public ones refuses the whole host.
 */
export const areResolvedAddressesAllowed = (addresses: string[]): boolean =>
  addresses.length > 0 && !addresses.some(isBlockedAddress);

export type ImportUrlCheck = { url: URL } | MediaImportFailure;

/**
 * A source URL the relay may request: `https:`, no credentials, and not a
 * literal blocked address or a `localhost` name. A hostname still has to pass
 * the DNS check at connect time. WHATWG URL parsing already turns
 * `0x7f.1`-style hosts into dotted quads.
 */
export function checkImportSourceUrl(raw: unknown): ImportUrlCheck {
  if (typeof raw !== 'string' || raw.length > MAX_URL_LENGTH)
    return { error: 'SOURCE_INVALID' };
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { error: 'SOURCE_INVALID' };
  }
  if (url.protocol !== 'https:' || url.username || url.password)
    return { error: 'SOURCE_INVALID' };
  const host = url.hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase();
  if (!host) return { error: 'SOURCE_INVALID' };
  if (host === 'localhost' || host.endsWith('.localhost'))
    return { error: 'SOURCE_BLOCKED' };
  const isLiteral = parseIpv4(host) !== undefined || host.includes(':');
  if (isLiteral && isBlockedAddress(host)) return { error: 'SOURCE_BLOCKED' };
  return { url };
}

/** Upload plan URLs must point at one of Geins' storage accounts, or the relay could push data anywhere. */
export function isAllowedUploadUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      UPLOAD_ORIGINS.includes(url.origin)
    );
  } catch {
    return false;
  }
}

export const isRedirectStatus = (status: number): boolean =>
  REDIRECT_STATUSES.has(status);

/**
 * The next hop of a redirect, re-checked like the original URL. `followed` is
 * how many redirects came before this one. A hop that's merely unusable (an
 * `http:` downgrade, a broken `Location`) is the host's fault, not the URL the
 * user typed, so it reads as unreachable; a blocked address stays blocked.
 */
export function resolveImportRedirect(
  from: URL,
  location: string | undefined,
  followed: number,
): ImportUrlCheck {
  if (!location || followed >= MEDIA_IMPORT_MAX_REDIRECTS)
    return { error: 'SOURCE_UNREACHABLE' };
  let next: URL;
  try {
    next = new URL(location, from);
  } catch {
    return { error: 'SOURCE_UNREACHABLE' };
  }
  const check = checkImportSourceUrl(next.href);
  return 'error' in check && check.error === 'SOURCE_INVALID'
    ? { error: 'SOURCE_UNREACHABLE' }
    : check;
}

export interface ImportSourceHeaders {
  status: number;
  contentLength?: string;
  contentRange?: string;
  contentEncoding?: string;
}

const encoded = (contentEncoding?: string): boolean =>
  !!contentEncoding && contentEncoding.trim().toLowerCase() !== 'identity';

function byteCount(value?: string): number | undefined {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const n = Number(value.trim());
  return Number.isSafeInteger(n) ? n : undefined;
}

// `bytes 0-0/12345`; a `*` total means the server doesn't know.
const rangeTotal = (value?: string): number | undefined =>
  byteCount(/^bytes\s+(?:\d+-\d+|\*)\/(\d+)\s*$/i.exec(value ?? '')?.[1]);

/**
 * The file's size from a probe response: `Content-Length` on a `200` (a
 * `HEAD`, or a `GET` that ignored its `Range`), the `Content-Range` total on a
 * `206`. A compressed body's length isn't the file's size, and some dynamic
 * hosts answer `HEAD` with length 0: an empty file is never a valid import, so
 * 0 counts as unknown and the probe goes on to the `Range` GET.
 */
export function importSizeFromHeaders(
  headers: ImportSourceHeaders,
): { sizeBytes: number } | MediaImportFailure {
  const { status } = headers;
  if (status === 404 || status === 410) return { error: 'SOURCE_NOT_FOUND' };
  if (status !== 200 && status !== 206) return { error: 'SOURCE_UNREACHABLE' };
  if (encoded(headers.contentEncoding)) return { error: 'SOURCE_SIZE_UNKNOWN' };
  const size =
    status === 206
      ? rangeTotal(headers.contentRange)
      : byteCount(headers.contentLength);
  if (!size) return { error: 'SOURCE_SIZE_UNKNOWN' };
  if (size > MAX_FILE_BYTES) return { error: 'SOURCE_TOO_LARGE' };
  return { sizeBytes: size };
}

/**
 * Whether a failed `HEAD` is worth a `GET` with `Range: bytes=0-0`: hosts that
 * refuse `HEAD` (`405`, or `403` on a URL signed for `GET`) or omit its
 * length. A missing file or an oversize one stays as it is.
 */
export const needsRangeProbe = (error: MediaImportErrorCode): boolean =>
  error === 'SOURCE_UNREACHABLE' || error === 'SOURCE_SIZE_UNKNOWN';

/**
 * Why a transfer's source response can't be streamed as `sizeBytes`, before
 * any byte is read. A missing `Content-Length` is fine: the stream is counted.
 */
export function importTransferProblem(
  headers: ImportSourceHeaders,
  sizeBytes: number,
): MediaImportErrorCode | undefined {
  if (headers.status === 404 || headers.status === 410)
    return 'SOURCE_NOT_FOUND';
  if (headers.status !== 200) return 'SOURCE_UNREACHABLE';
  if (encoded(headers.contentEncoding)) return 'SOURCE_SIZE_MISMATCH';
  const length = byteCount(headers.contentLength);
  if (length !== undefined && length !== sizeBytes)
    return 'SOURCE_SIZE_MISMATCH';
  return undefined;
}

/** The bare media type of a `Content-Type` header, lower-cased, or `''`. */
export function importMimeType(contentType?: string): string {
  const type = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return MIME_RE.test(type) ? type : '';
}

export type ParsedImportBody<T> = { value: T } | { problem: string };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/** A probe body, or why it's a `400`. The URL itself is checked per row. */
export function parseMediaImportProbe(
  body: unknown,
): ParsedImportBody<MediaImportProbeRequest> {
  const { url } = asRecord(body);
  return typeof url === 'string'
    ? { value: { url } }
    : { problem: 'Missing url' };
}

/**
 * A transfer body, or why it's a `400`: malformed fields, or an upload URL
 * off `UPLOAD_ORIGINS`. Size cap and source URL are row errors, checked after.
 */
export function parseMediaImportTransfer(
  body: unknown,
): ParsedImportBody<MediaImportTransferRequest> {
  const { sourceUrl, uploadUrl, sizeBytes, mimeType } = asRecord(body);
  if (
    typeof sourceUrl !== 'string' ||
    typeof uploadUrl !== 'string' ||
    typeof mimeType !== 'string' ||
    typeof sizeBytes !== 'number'
  )
    return { problem: 'Invalid body' };
  if (!isAllowedUploadUrl(uploadUrl))
    return { problem: 'Upload URL not allowed' };
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0)
    return { problem: 'Invalid sizeBytes' };
  if (!MIME_RE.test(mimeType)) return { problem: 'Invalid mimeType' };
  return { value: { sourceUrl, uploadUrl, sizeBytes, mimeType } };
}

// Keys under `asset_library.*` in both locales; the import summary shows them.
const MEDIA_IMPORT_ERROR_KEYS: Record<MediaImportErrorCode, string> = {
  SOURCE_INVALID: 'asset_library.import_error_source_invalid',
  SOURCE_BLOCKED: 'asset_library.import_error_source_blocked',
  SOURCE_UNREACHABLE: 'asset_library.import_error_source_unreachable',
  SOURCE_NOT_FOUND: 'asset_library.import_error_source_not_found',
  SOURCE_TOO_LARGE: 'asset_library.upload_reject_file_too_large',
  SOURCE_SIZE_UNKNOWN: 'asset_library.import_error_source_size_unknown',
  SOURCE_SIZE_MISMATCH: 'asset_library.import_error_source_size_mismatch',
  UPLOAD_FAILED: 'asset_library.upload_reject_generic',
};

/** i18n key for a relay error code (generic fallback). */
export const mediaImportErrorMessageKey = (
  code: MediaImportErrorCode,
): string =>
  MEDIA_IMPORT_ERROR_KEYS[code] ?? 'asset_library.upload_reject_generic';
