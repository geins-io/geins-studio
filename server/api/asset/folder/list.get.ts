import { defineEventHandler, createError } from 'h3';
import { assetMockSupabase, toFolder } from '../../../utils/assets-mock';

// GET /api/asset/folder/list — repo `folder.list()`. Full tree (bare Folder[]).
export default defineEventHandler(async () => {
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('folder')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  return (data ?? []).map(toFolder);
});
