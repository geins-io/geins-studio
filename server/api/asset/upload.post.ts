import { randomUUID } from 'node:crypto';
import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import type { Asset, AssetUploadMeta } from '#shared/types';
import { mimeToAssetType } from '#shared/utils/asset';
import {
  assetFolderPath,
  assetMockSupabase,
  loadFolderPaths,
  toAsset,
} from '../../utils/assets-mock';

// POST /api/asset/upload — repo `upload(formData)`. Stores each file in the
// `assets` bucket and inserts the asset row; returns the created Asset[].
//
// The upload wizard sends a `meta` field — a JSON array of `AssetUploadMeta`,
// one per file part in the same order — carrying per-file folder / name / tags /
// channels / description / localizations. The quick-upload dialog omits it and
// sends a single `folderId` field applied to every file.
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

  let meta: AssetUploadMeta[] = [];
  if (fields.meta) {
    try {
      const parsed = JSON.parse(fields.meta);
      if (Array.isArray(parsed)) meta = parsed as AssetUploadMeta[];
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid meta' });
    }
  }
  const fallbackFolderId = fields.folderId || null;

  const sb = assetMockSupabase();
  const bucket = sb.storage.from('assets');
  const created: Asset[] = [];
  const failed: string[] = [];
  const paths = await loadFolderPaths(sb);

  for (const [i, file] of files.entries()) {
    const m = meta[i] ?? {};
    const type = mimeToAssetType(file.type);
    // Unguessable prefix + a filesystem-safe filename for the storage key.
    const safeName = file.filename.replace(/[^\w.-]+/g, '_');
    const path = `${randomUUID()}/${safeName}`;

    try {
      const { error: uploadError } = await bucket.upload(path, file.data, {
        contentType: file.type,
        upsert: true,
      });
      if (uploadError) throw new Error(uploadError.message);
      const url = bucket.getPublicUrl(path).data.publicUrl;

      const { data, error } = await sb
        .from('asset')
        .insert({
          name: m.name || file.filename,
          type,
          folder_id: m.folderId ?? fallbackFolderId,
          size_bytes: file.data.length,
          mime: file.type,
          url,
          // v0: reuse the original as the thumbnail for images + SVGs (both render
          // directly in an <img>); no thumb otherwise.
          thumb_url: type === 'image' || type === 'svg' ? url : null,
          description: m.description ?? null,
          // localizations is NOT NULL default '{}' — never insert null.
          localizations: m.localizations ?? {},
          tags: m.tags ?? [],
          channels: m.channels ?? [],
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      created.push(toAsset(data, assetFolderPath(paths, data.folder_id)));
    } catch {
      // Per-file failure: record and continue so one bad file doesn't sink the
      // whole batch (partial success is reconciled by the caller).
      failed.push(file.filename);
    }
  }

  // Nothing stored at all → surface as an error (global toast). A partial batch
  // returns the created subset; the caller compares counts to report failures.
  if (!created.length) {
    throw createError({
      statusCode: 502,
      statusMessage: `Upload failed for ${failed.length} file(s)`,
    });
  }

  return created;
});
