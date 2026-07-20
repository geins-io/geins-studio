import { defineEventHandler, getRouterParam, createError } from 'h3';
import { assetMockSupabase, toAsset } from '../../utils/assets-mock';

// GET /api/asset/:id — repo `get(id)`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing asset id' });
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('asset')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
  return toAsset(data);
});
