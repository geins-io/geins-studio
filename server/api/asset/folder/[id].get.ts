import { defineEventHandler, getRouterParam, createError } from 'h3';
import { assetMockSupabase, toFolder } from '../../../utils/assets-mock';

// GET /api/asset/folder/:id — repo `folder.get(id)`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing folder id' });
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('folder')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Folder not found' });
  return toFolder(data);
});
