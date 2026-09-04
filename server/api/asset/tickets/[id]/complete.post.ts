import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import type {
  UploadCompleteResponse,
  UploadCompleteResult,
} from '#shared/types';
import { mimeToAssetType } from '#shared/utils/asset';
import {
  assetFolderPath,
  assetMockSupabase,
  loadFolderPaths,
  toAsset,
  type AssetRow,
} from '../../../../utils/assets-mock';
import { dropTicket, getTicket } from '../../../../utils/upload-tickets';

// POST /api/asset/tickets/:id/complete — step 3. Confirms uploaded bytes and
// publishes each as an asset row. Optional `{ files: clientRef[] }` completes a
// subset; an empty body completes every entry whose bytes are in place. Always
// HTTP 200 with per-file completed/rejected results.
export default defineEventHandler(
  async (event): Promise<UploadCompleteResponse> => {
    const id = getRouterParam(event, 'id');
    const ticket = id ? getTicket(id) : undefined;
    if (!ticket)
      throw createError({ statusCode: 400, statusMessage: 'BATCH_NOT_FOUND' });

    const body = (await readBody<{ files?: string[] }>(event)) ?? {};
    const subset =
      Array.isArray(body.files) && body.files.length
        ? new Set(body.files)
        : null;

    const sb = assetMockSupabase();
    const paths = await loadFolderPaths(sb);
    const results: UploadCompleteResult[] = [];

    for (const [clientRef, f] of ticket.files) {
      if (subset && !subset.has(clientRef)) continue;
      if (!f.hasBytes) {
        results.push({
          clientRef,
          status: 'rejected',
          code: 'BLOB_MISSING',
          message: 'No bytes were uploaded for this file.',
        });
        continue;
      }

      const type = mimeToAssetType(f.mimeType);
      const cols = {
        type,
        size_bytes: f.sizeBytes,
        mime: f.mimeType,
        url: f.url,
        thumb_url: f.thumbUrl,
      };

      // Overwrite repoints the existing row at the path; otherwise insert new.
      let row: AssetRow | null = null;
      if (f.overwrite) {
        let q = sb.from('asset').update(cols).eq('name', f.name);
        q = f.folderId
          ? q.eq('folder_id', f.folderId)
          : q.is('folder_id', null);
        const updated = await q.select('*').maybeSingle();
        row = updated.data;
      }
      if (!row) {
        const inserted = await sb
          .from('asset')
          .insert({
            name: f.name,
            folder_id: f.folderId,
            tags: [],
            channels: [],
            localizations: {},
            ...cols,
          })
          .select('*')
          .single();
        if (inserted.error || !inserted.data) {
          results.push({
            clientRef,
            status: 'rejected',
            code: 'CONTENT_TYPE_MISMATCH',
            message: inserted.error?.message ?? 'Insert failed.',
          });
          continue;
        }
        row = inserted.data;
      }
      if (!row) continue;

      results.push({
        clientRef,
        status: 'completed',
        file: toAsset(row, assetFolderPath(paths, row.folder_id)),
      });
    }

    dropTicket(ticket.ticketId);
    return { results };
  },
);
