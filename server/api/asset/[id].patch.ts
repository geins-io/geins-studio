import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import {
  assetMockSupabase,
  assetColumns,
  toAsset,
} from '../../utils/assets-mock';

// PATCH /api/asset/:id — repo `update(id, data)`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing asset id' });
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('asset')
    .update(assetColumns(body))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
  return toAsset(data);
});
