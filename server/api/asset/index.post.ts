import { defineEventHandler, readBody, createError } from 'h3';
import {
  assetMockSupabase,
  assetColumns,
  toAsset,
} from '../../utils/assets-mock';

// POST /api/asset — repo `create()`.
export default defineEventHandler(async (event) => {
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('asset')
    .insert(assetColumns(body))
    .select('*')
    .single();
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return toAsset(data);
});
