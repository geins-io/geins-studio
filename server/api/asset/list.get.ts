import { defineEventHandler, getQuery, createError } from 'h3';
import {
  assetMockSupabase,
  descendantFolderIds,
  toAsset,
} from '../../utils/assets-mock';

// GET /api/asset/list — repo `list()`. Returns a bare Asset[] (the contract).
export default defineEventHandler(async (event) => {
  const sb = assetMockSupabase();
  const q = getQuery(event);
  const folderId = typeof q.folderId === 'string' ? q.folderId : undefined;
  const search = typeof q.search === 'string' ? q.search.trim() : '';

  let query = sb
    .from('asset')
    .select('*')
    .order('updated_at', { ascending: false });

  // Folder-as-category: include the selected folder + all descendants.
  if (folderId) {
    const { data: folders, error: fErr } = await sb
      .from('folder')
      .select('id,parent_id');
    if (fErr)
      throw createError({ statusCode: 502, statusMessage: fErr.message });
    query = query.in('folder_id', descendantFolderIds(folders ?? [], folderId));
  }
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  return (data ?? []).map(toAsset);
});
