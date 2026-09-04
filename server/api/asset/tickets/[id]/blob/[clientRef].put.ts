import {
  defineEventHandler,
  getRouterParam,
  getHeader,
  readRawBody,
  createError,
} from 'h3';
import { mimeToAssetType } from '#shared/utils/asset';
import { assetMockSupabase } from '../../../../../utils/assets-mock';
import { getTicket } from '../../../../../utils/upload-tickets';

// PUT /api/asset/tickets/:id/blob/:clientRef — step 2. Emulates the direct PUT
// of bytes to the signed storage URL: stores the raw body in the `assets`
// bucket and marks the ticket entry as having bytes. No auth header (mirrors
// the real signed-URL PUT). Bytes are only published as an asset by `complete`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const clientRef = getRouterParam(event, 'clientRef');
  const ticket = id ? getTicket(id) : undefined;
  if (!ticket)
    throw createError({
      statusCode: 410,
      statusMessage: 'Ticket not found or expired',
    });
  const file = clientRef ? ticket.files.get(clientRef) : undefined;
  if (!file)
    throw createError({ statusCode: 404, statusMessage: 'Unknown file' });

  const body = await readRawBody(event, false);
  if (!body?.length)
    throw createError({ statusCode: 400, statusMessage: 'Empty body' });

  const contentType = getHeader(event, 'content-type') || file.mimeType;
  const sb = assetMockSupabase();
  const bucket = sb.storage.from('assets');
  const { error } = await bucket.upload(file.storagePath, body, {
    contentType,
    upsert: true,
  });
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });

  const url = bucket.getPublicUrl(file.storagePath).data.publicUrl;
  const type = mimeToAssetType(contentType);
  file.url = url;
  // v0: reuse the original as the thumbnail for images + SVGs (render in <img>).
  file.thumbUrl = type === 'image' || type === 'svg' ? url : null;
  file.hasBytes = true;
  return null;
});
