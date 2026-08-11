import { randomUUID } from 'node:crypto';
import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import type { Asset } from '#shared/types';
import { mimeToAssetType } from '#shared/utils/asset';
import { assetMockSupabase, toAsset } from '../../utils/assets-mock';

// POST /api/asset/upload — repo `upload(formData)`. Stores each file in the
// `assets` bucket and inserts the asset row; returns the created Asset[].
export default defineEventHandler(async (event): Promise<Asset[]> => {
  const parts = await readMultipartFormData(event);
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' });
  }

  const fields: Record<string, string> = {};
  const files: { filename: string; type: string; data: Buffer }[] = [];
  for (const part of parts) {
    if (part.filename) {
      files.push({
        filename: part.filename,
        type: part.type || 'application/octet-stream',
        data: part.data,
      });
    } else if (part.name) {
      fields[part.name] = part.data.toString('utf8');
    }
  }
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' });
  }

  const folderId = fields.folderId || null;
  const sb = assetMockSupabase();
  const bucket = sb.storage.from('assets');
  const created: Asset[] = [];

  for (const file of files) {
    const type = mimeToAssetType(file.type);
    // Unguessable prefix + a filesystem-safe filename for the storage key.
    const safeName = file.filename.replace(/[^\w.-]+/g, '_');
    const path = `${randomUUID()}/${safeName}`;

    const { error: uploadError } = await bucket.upload(path, file.data, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      throw createError({
        statusCode: 502,
        statusMessage: uploadError.message,
      });
    }
    const url = bucket.getPublicUrl(path).data.publicUrl;

    const { data, error } = await sb
      .from('asset')
      .insert({
        name: file.filename,
        type,
        folder_id: folderId,
        size_bytes: file.data.length,
        mime: file.type,
        url,
        // v0: reuse the original as the thumbnail for images + SVGs (both render
        // directly in an <img>); no thumb otherwise.
        thumb_url: type === 'image' || type === 'svg' ? url : null,
        tags: [],
        channels: [],
      })
      .select('*')
      .single();
    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }
    created.push(toAsset(data));
  }

  return created;
});
