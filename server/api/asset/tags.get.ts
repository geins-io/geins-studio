import { defineEventHandler, createError } from 'h3';
import { assetMockSupabase, distinctSortedTags } from '../../utils/assets-mock';

// GET /api/asset/tags — repo `listTags()`. Distinct, sorted tag set across all
// assets, for the tag-input suggestions. Static route wins over `[id].get.ts`.
export default defineEventHandler(async () => {
  const sb = assetMockSupabase();
  const { data, error } = await sb.from('asset').select('tags');
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  return distinctSortedTags(data ?? []);
});
