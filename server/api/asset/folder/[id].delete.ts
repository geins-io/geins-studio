import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3';
import {
  assetMockSupabase,
  descendantFolderIds,
} from '../../../utils/assets-mock';

// DELETE /api/asset/folder/:id?assets=move|delete — repo `deleteFolder(id, assets)`.
// `move` (default): assets in the folder fall back to uncategorised (FK is
// ON DELETE SET NULL); child folders cascade (their assets SET NULL too).
// `delete`: permanently remove every asset in the folder + descendant subtree
// first, then delete the folder (child folders cascade).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing folder id' });
  const assets = getQuery(event).assets === 'delete' ? 'delete' : 'move';
  const sb = assetMockSupabase();

  if (assets === 'delete') {
    const { data: folders, error: fErr } = await sb
      .from('folder')
      .select('id,parent_id');
    if (fErr)
      throw createError({ statusCode: 502, statusMessage: fErr.message });
    const subtree = descendantFolderIds(folders ?? [], id);
    const { error: aErr } = await sb
      .from('asset')
      .delete()
      .in('folder_id', subtree);
    if (aErr)
      throw createError({ statusCode: 400, statusMessage: aErr.message });
  }

  const { error } = await sb.from('folder').delete().eq('id', id);
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return null;
});
