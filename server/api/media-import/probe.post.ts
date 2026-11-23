import { createError, defineEventHandler, readBody } from 'h3';
import type { MediaImportProbeResult } from '#shared/types';
import { log } from '#shared/utils/log';
import {
  checkImportSourceUrl,
  parseMediaImportProbe,
} from '#shared/utils/media-import';
import {
  clientGoneSignal,
  probeSource,
  requireMediaImportSession,
  urlHost,
} from '../../utils/media-import';

/**
 * Size and MIME type of a CSV row's file, for the upload ticket claim. A row
 * that can't be probed answers `{ error }` with 200: it's a row result, not a
 * failed request.
 */
export default defineEventHandler(
  async (event): Promise<MediaImportProbeResult> => {
    await requireMediaImportSession(event);
    const body = parseMediaImportProbe(await readBody(event));
    if ('problem' in body) {
      throw createError({ statusCode: 400, statusMessage: body.problem });
    }
    const source = checkImportSourceUrl(body.value.url);
    if ('error' in source) {
      log('server/api/media-import/probe').geinsLogWarn(
        `${urlHost(body.value.url)}: ${source.error}`,
      );
      return source;
    }
    return probeSource(source.url, clientGoneSignal(event));
  },
);
