import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import {
  assetMockSupabase,
  folderColumns,
  toFolder,
} from '../../../utils/assets-mock';

// PATCH /api/asset/folder/:id — repo `folder.update(id, data)` (rename/move).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing folder id' });
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('folder')
    .update(folderColumns(body))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Folder not found' });
  return toFolder(data);
});
