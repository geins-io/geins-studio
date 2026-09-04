import { randomUUID } from 'node:crypto';
import { defineEventHandler, readBody, createError } from 'h3';
import type {
  UploadTicketFile,
  UploadTicketResponse,
  UploadTicketResult,
} from '#shared/types';
import { assetMockSupabase } from '../../utils/assets-mock';
import {
  createTicket,
  validateUploadClaim,
  MAX_FILES_PER_TICKET,
  MAX_TICKET_BYTES,
} from '../../utils/upload-tickets';

// POST /api/asset/tickets — repo `uploadViaTickets()` step 1. Claims a ticket
// for N files: validates each, reserves a blob path, and returns a per-file
// upload plan (mock same-origin PUT URL). Always HTTP 200 with per-file
// accepted/rejected results (a partial rejection is not a request error).
export default defineEventHandler(
  async (event): Promise<UploadTicketResponse> => {
    const body = (await readBody<{ files?: UploadTicketFile[] }>(event)) ?? {};
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length)
      throw createError({ statusCode: 400, statusMessage: 'No files' });
    if (files.length > MAX_FILES_PER_TICKET)
      throw createError({
        statusCode: 400,
        statusMessage: `Too many files (max ${MAX_FILES_PER_TICKET})`,
      });
    const totalBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    if (totalBytes > MAX_TICKET_BYTES)
      throw createError({
        statusCode: 400,
        statusMessage: 'Ticket over 10 GB',
      });

    const sb = assetMockSupabase();
    const ticket = createTicket();
    const results: UploadTicketResult[] = [];

    for (const file of files) {
      const rejection = validateUploadClaim(file);
      if (rejection) {
        results.push({
          clientRef: file.clientRef,
          status: 'rejected',
          ...rejection,
        });
        continue;
      }

      // PATH_ALREADY_EXISTS: same name in the same folder, unless overwrite.
      let existsQuery = sb.from('asset').select('id').eq('name', file.name);
      existsQuery = file.folderId
        ? existsQuery.eq('folder_id', file.folderId)
        : existsQuery.is('folder_id', null);
      const { data: existing } = await existsQuery.limit(1);
      if (existing?.length && !file.overwrite) {
        results.push({
          clientRef: file.clientRef,
          status: 'rejected',
          code: 'PATH_ALREADY_EXISTS',
          message: 'An asset already exists at this path.',
        });
        continue;
      }

      const assetId = randomUUID();
      const safeName = file.name.replace(/[^\w.-]+/g, '_');
      ticket.files.set(file.clientRef, {
        clientRef: file.clientRef,
        assetId,
        folderId: file.folderId ?? null,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        overwrite: !!file.overwrite,
        storagePath: `${assetId}/${safeName}`,
        hasBytes: false,
        url: null,
        thumbUrl: null,
      });
      results.push({
        clientRef: file.clientRef,
        status: 'accepted',
        assetId,
        upload: {
          mode: 'single',
          url: `/api/asset/tickets/${ticket.ticketId}/blob/${file.clientRef}`,
        },
      });
    }

    return {
      ticketId: ticket.ticketId,
      expiresAt: new Date(ticket.expiresAt).toISOString(),
      results,
    };
  },
);
