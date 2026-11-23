import { createError, defineEventHandler, readBody } from 'h3';
import type { MediaImportTransferResult } from '#shared/types';
import { MAX_FILE_BYTES } from '#shared/utils/asset';
import { log } from '#shared/utils/log';
import {
  checkImportSourceUrl,
  parseMediaImportTransfer,
} from '#shared/utils/media-import';
import {
  clientGoneSignal,
  requireMediaImportSession,
  transferSource,
  urlHost,
} from '../../utils/media-import';

// Azure App Service drops a request that sends nothing for ~240 s.
const HEARTBEAT_MS = 20_000;

/**
 * Streams a CSV row's file from its source into an upload ticket's signed URL.
 * Answers `{ ok: true }` or `{ error }` with 200; only a malformed body, an
 * upload URL off `UPLOAD_ORIGINS` (400) or a missing session (401) fail the
 * request itself.
 */
export default defineEventHandler(
  async (event): Promise<MediaImportTransferResult | undefined> => {
    await requireMediaImportSession(event);
    const raw = await readBody<{ uploadUrl?: unknown }>(event);
    const body = parseMediaImportTransfer(raw);
    if ('problem' in body) {
      // A refused upload host is an attempt to push data elsewhere: keep a trace.
      log('server/api/media-import/transfer').geinsLogWarn(
        `400 ${body.problem} (upload host ${urlHost(raw?.uploadUrl)})`,
      );
      throw createError({ statusCode: 400, statusMessage: body.problem });
    }
    const request = body.value;
    if (request.sizeBytes > MAX_FILE_BYTES)
      return { error: 'SOURCE_TOO_LARGE' };
    const source = checkImportSourceUrl(request.sourceUrl);
    if ('error' in source) {
      log('server/api/media-import/transfer').geinsLogWarn(
        `${urlHost(request.sourceUrl)}: ${source.error}`,
      );
      return source;
    }

    // Whitespace until the result: JSON.parse (and ofetch) skip it, and it
    // keeps a long transfer's connection from idling out. Headers go first,
    // so from here on every outcome is a 200 body.
    const signal = clientGoneSignal(event);
    const { res } = event.node;
    res.writeHead(200, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    });
    const heartbeat = setInterval(() => res.write(' '), HEARTBEAT_MS);
    let result: MediaImportTransferResult;
    try {
      result = await transferSource(source.url, request, signal);
    } catch (err) {
      // The status is already sent, so h3 can't turn this into an error page.
      log('server/api/media-import/transfer').geinsLogError(
        `${source.url.host}: unexpected ${err instanceof Error ? err.name : typeof err}`,
      );
      result = { error: 'UPLOAD_FAILED' };
    } finally {
      clearInterval(heartbeat);
    }
    res.end(JSON.stringify(result));
  },
);
