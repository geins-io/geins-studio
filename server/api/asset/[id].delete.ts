import { defineEventHandler, getRouterParam, createError } from 'h3';
import { assetMockSupabase } from '../../utils/assets-mock';

// DELETE /api/asset/:id — repo `delete(id)`. Returns null.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing asset id' });
  const sb = assetMockSupabase();
  const { error } = await sb.from('asset').delete().eq('id', id);
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return null;
});
