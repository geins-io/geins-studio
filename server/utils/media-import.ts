import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { Transform } from 'node:stream';
import { createError, type H3Event } from 'h3';
import { Agent, request, type Dispatcher } from 'undici';
import type {
  MediaImportErrorCode,
  MediaImportProbeResult,
  MediaImportTransferRequest,
  MediaImportTransferResult,
} from '#shared/types';
import { log } from '#shared/utils/log';
import {
  MEDIA_IMPORT_USER_AGENT,
  areResolvedAddressesAllowed,
  importMimeType,
  importSizeFromHeaders,
  importTransferProblem,
  isRedirectStatus,
  needsRangeProbe,
  resolveImportRedirect,
  type ImportSourceHeaders,
} from '#shared/utils/media-import';
import { readSealedSession } from './sealed-session';
import type { LookupFunction } from 'node:net';

const CONNECT_TIMEOUT_MS = 10_000;
/** No bytes from the source (or no response yet) for this long aborts it. */
const IDLE_TIMEOUT_MS = 30_000;
const PROBE_HEADERS_TIMEOUT_MS = 10_000;

export class MediaImportError extends Error {
  constructor(readonly code: MediaImportErrorCode) {
    super(code);
    this.name = 'MediaImportError';
  }
}

/** The relay fetches arbitrary URLs: without a session it would be an open proxy. */
export async function requireMediaImportSession(event: H3Event): Promise<void> {
  const session = await readSealedSession(event);
  if (!session.user || !session.secure?.accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
}

/** Aborts once the browser goes away before the response is done. */
export function clientGoneSignal(event: H3Event): AbortSignal {
  const controller = new AbortController();
  const { res } = event.node;
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });
  return controller.signal;
}

/** For logs: the host only, never the path or query (they can carry tokens). */
export function urlHost(raw: unknown): string {
  try {
    return typeof raw === 'string' ? new URL(raw).host || '?' : '?';
  } catch {
    return '?';
  }
}

/**
 * Resolves the source host and refuses it if any address is blocked. undici
 * connects to the address this returns, so a DNS answer can't change between
 * the check and the connect (rebinding). IP-literal hosts skip lookup: those
 * are refused by `checkImportSourceUrl` before any request.
 */
const pinnedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(
    hostname,
    { ...options, all: true },
    (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => {
      if (err) return callback(err, '');
      if (!areResolvedAddressesAllowed(addresses.map((a) => a.address))) {
        return callback(new MediaImportError('SOURCE_BLOCKED'), '');
      }
      if (options.all) return callback(null, addresses);
      const [first] = addresses;
      callback(null, first!.address, first!.family);
    },
  );
};

const sourceAgent = new Agent({
  connect: { timeout: CONNECT_TIMEOUT_MS, lookup: pinnedLookup },
  headersTimeout: IDLE_TIMEOUT_MS,
  bodyTimeout: IDLE_TIMEOUT_MS,
});

// The upload host is on UPLOAD_ORIGINS, so it needs no pinned lookup. While
// the body streams, undici only fires headersTimeout if the socket stalls.
const uploadAgent = new Agent({
  connect: { timeout: CONNECT_TIMEOUT_MS },
  headersTimeout: IDLE_TIMEOUT_MS,
  bodyTimeout: IDLE_TIMEOUT_MS,
});

const SOURCE_HEADERS = {
  'user-agent': MEDIA_IMPORT_USER_AGENT,
  accept: '*/*',
  // The probed size must be the bytes we stream, not a compressed length.
  'accept-encoding': 'identity',
};

type SourceResponse = Dispatcher.ResponseData;

const header = (res: SourceResponse, name: string): string | undefined => {
  const value = res.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

const sourceHeaders = (res: SourceResponse): ImportSourceHeaders => ({
  status: res.statusCode,
  contentLength: header(res, 'content-length'),
  contentRange: header(res, 'content-range'),
  contentEncoding: header(res, 'content-encoding'),
});

// dump() drops the body without an unhandled 'error' (destroy() would emit one).
// limit 0 would fall back to dump's 128 KB default.
const discard = (res: SourceResponse) => res.body.dump({ limit: 1 });

/** Code + name only: an error message can carry the URL and its query. */
function errorTag(err: unknown): string {
  const tags: string[] = [];
  for (let e = err, depth = 0; e instanceof Error && depth < 3; depth++) {
    const code = (e as NodeJS.ErrnoException).code;
    tags.push(code ? `${e.name}/${code}` : e.name);
    e = e.cause;
  }
  return tags.join(' <- ') || String(typeof err);
}

function importErrorCode(
  err: unknown,
  fallback: MediaImportErrorCode,
): MediaImportErrorCode {
  for (let e = err, depth = 0; e instanceof Error && depth < 5; depth++) {
    if (e instanceof MediaImportError) return e.code;
    e = e.cause;
  }
  return fallback;
}

/** GET/HEAD the source, following up to 5 redirects by hand and re-checking each hop. */
async function openSource(
  start: URL,
  method: 'GET' | 'HEAD',
  options: { range?: string; headersTimeout?: number; signal?: AbortSignal },
): Promise<SourceResponse> {
  let url = start;
  for (let followed = 0; ; followed++) {
    const res = await request(url, {
      method,
      headers: options.range
        ? { ...SOURCE_HEADERS, range: options.range }
        : SOURCE_HEADERS,
      dispatcher: sourceAgent,
      headersTimeout: options.headersTimeout,
      signal: options.signal,
    });
    if (!isRedirectStatus(res.statusCode)) return res;
    await discard(res);
    const next = resolveImportRedirect(url, header(res, 'location'), followed);
    if ('error' in next) throw new MediaImportError(next.error);
    url = next.url;
  }
}

async function probeOnce(
  url: URL,
  method: 'GET' | 'HEAD',
  signal?: AbortSignal,
): Promise<MediaImportProbeResult> {
  const res = await openSource(url, method, {
    range: method === 'GET' ? 'bytes=0-0' : undefined,
    headersTimeout: PROBE_HEADERS_TIMEOUT_MS,
    signal,
  });
  await discard(res);
  const size = importSizeFromHeaders(sourceHeaders(res));
  if ('error' in size) return size;
  return {
    sizeBytes: size.sizeBytes,
    mimeType: importMimeType(header(res, 'content-type')),
  };
}

/** Size and MIME type for a ticket claim: `HEAD`, then a one-byte `Range` GET if that fails. */
export async function probeSource(
  url: URL,
  signal?: AbortSignal,
): Promise<MediaImportProbeResult> {
  const { geinsLogWarn } = log('server/api/media-import/probe');
  try {
    let result = await probeOnce(url, 'HEAD', signal);
    if ('error' in result && needsRangeProbe(result.error)) {
      result = await probeOnce(url, 'GET', signal);
    }
    if ('error' in result) geinsLogWarn(`${url.host}: ${result.error}`);
    return result;
  } catch (err) {
    const error = importErrorCode(err, 'SOURCE_UNREACHABLE');
    geinsLogWarn(`${url.host}: ${error} (${errorTag(err)})`);
    return { error };
  }
}

/** Passes exactly `expected` bytes; more, or fewer by the end, errors. */
function sizeGuard(expected: number): Transform {
  let seen = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      seen += chunk.length;
      if (seen > expected)
        callback(new MediaImportError('SOURCE_SIZE_MISMATCH'));
      else callback(null, chunk);
    },
    flush(callback) {
      callback(
        seen === expected ? null : new MediaImportError('SOURCE_SIZE_MISMATCH'),
      );
    },
  });
}

/**
 * Streams `GET source` into `PUT uploadUrl` (an Azure Blob SAS URL) with the
 * headers the browser's upload sends. Nothing is buffered beyond the streams'
 * own high-water marks.
 */
export async function transferSource(
  source: URL,
  { uploadUrl, sizeBytes, mimeType }: MediaImportTransferRequest,
  signal?: AbortSignal,
): Promise<MediaImportTransferResult> {
  const { geinsLogWarn } = log('server/api/media-import/transfer');
  const fail = (error: MediaImportErrorCode, detail = '') => {
    geinsLogWarn(`${source.host}: ${error}${detail && ` (${detail})`}`);
    return { error };
  };

  let res: SourceResponse;
  try {
    res = await openSource(source, 'GET', { signal });
  } catch (err) {
    return fail(importErrorCode(err, 'SOURCE_UNREACHABLE'), errorTag(err));
  }
  const problem = importTransferProblem(sourceHeaders(res), sizeBytes);
  if (problem) {
    await discard(res);
    return fail(problem, `status ${res.statusCode}`);
  }

  // Source-side failures win over the upload error they cause.
  let sourceError: MediaImportErrorCode | undefined;
  let settled = false;
  const body = sizeGuard(sizeBytes);
  // Only the size guard's own errors: undici also destroys the body when the
  // upload itself fails, and that one stays UPLOAD_FAILED.
  body.on('error', (err) => {
    if (err instanceof MediaImportError) sourceError ??= err.code;
  });
  res.body.on('error', (err) => {
    if (settled) return;
    sourceError ??= importErrorCode(err, 'SOURCE_UNREACHABLE');
    body.destroy(new MediaImportError(sourceError));
  });
  res.body.pipe(body);

  try {
    const put = await request(uploadUrl, {
      method: 'PUT',
      body,
      headers: {
        'content-length': String(sizeBytes),
        'content-type': mimeType,
        // Azure Put Blob: the block-blob type, and the type it serves with.
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-blob-content-type': mimeType,
      },
      dispatcher: uploadAgent,
      signal,
    });
    await put.body.dump();
    if (put.statusCode < 200 || put.statusCode >= 300) {
      return fail('UPLOAD_FAILED', `upload status ${put.statusCode}`);
    }
    return { ok: true };
  } catch (err) {
    return fail(
      sourceError ?? importErrorCode(err, 'UPLOAD_FAILED'),
      errorTag(err),
    );
  } finally {
    settled = true;
    if (!res.body.destroyed) void discard(res);
  }
}
