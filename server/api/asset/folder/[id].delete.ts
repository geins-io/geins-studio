import { defineEventHandler, getRouterParam, createError } from 'h3';
import { assetMockSupabase } from '../../../utils/assets-mock';

// DELETE /api/asset/folder/:id — repo `folder.delete(id)`. Assets in the folder
// fall back to uncategorised (FK is ON DELETE SET NULL); child folders cascade.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing folder id' });
  const sb = assetMockSupabase();
  const { error } = await sb.from('folder').delete().eq('id', id);
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return null;
});
