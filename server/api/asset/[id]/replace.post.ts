import { randomUUID } from 'node:crypto';
import {
  defineEventHandler,
  getRouterParam,
  readMultipartFormData,
  createError,
} from 'h3';
import type { Asset } from '#shared/types';
import { mimeToAssetType } from '#shared/utils/asset';
import { assetMockSupabase, toAsset } from '../../../utils/assets-mock';

// POST /api/asset/:id/replace — repo `replace(id, formData)`. Uploads the new
// file to the `assets` bucket and repoints the existing row's file columns
// (url / thumb_url / size_bytes / mime / type), keeping the same asset id,
// metadata, and references. Name is metadata, so it is preserved.
export default defineEventHandler(async (event): Promise<Asset> => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing asset id' });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.filename);
  if (!file?.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const mime = file.type || 'application/octet-stream';
  const type = mimeToAssetType(mime);
  const sb = assetMockSupabase();
  const bucket = sb.storage.from('assets');

  // Unguessable prefix + a filesystem-safe filename for the storage key.
  const safeName = file.filename.replace(/[^\w.-]+/g, '_');
  const path = `${randomUUID()}/${safeName}`;
  const { error: uploadError } = await bucket.upload(path, file.data, {
    contentType: mime,
    upsert: true,
  });
  if (uploadError) {
    throw createError({ statusCode: 502, statusMessage: uploadError.message });
  }
  const url = bucket.getPublicUrl(path).data.publicUrl;

  const { data, error } = await sb
    .from('asset')
    .update({
      type,
      size_bytes: file.data.length,
      mime,
      url,
      // v0: reuse the original as the thumbnail for images; no thumb otherwise.
      thumb_url: type === 'image' ? url : null,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
  }
  return toAsset(data);
});
