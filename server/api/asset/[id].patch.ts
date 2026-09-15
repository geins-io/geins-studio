import {
  defineEventHandler,
  getRouterParam,
  getHeader,
  readBody,
  createError,
} from 'h3';
import {
  assetEtag,
  assetFolderPath,
  assetMockSupabase,
  assetColumns,
  loadFolderPaths,
  toAsset,
} from '../../utils/assets-mock';

// PATCH /api/asset/:id — repo `update(id, data)`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing asset id' });
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const sb = assetMockSupabase();

  // Optimistic concurrency: reject a stale write before touching the row. Fetch
  // the current etag and compare against the caller's If-Match; a mismatch is
  // 412 (the client reloads). No If-Match → skip the check (backwards-compatible).
  // cutover: the real Geins.Media API enforces this itself; drops with the mock.
  const ifMatch = getHeader(event, 'if-match');
  const { data: current, error: currentError } = await sb
    .from('asset')
    .select('updated_at')
    .eq('id', id)
    .maybeSingle();
  if (currentError)
    throw createError({ statusCode: 502, statusMessage: currentError.message });
  if (!current)
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
  if (ifMatch && ifMatch !== assetEtag(current.updated_at))
    throw createError({
      statusCode: 412,
      statusMessage: 'Asset changed since it was loaded',
    });

  // Bump updated_at so the derived etag advances on every write.
  const { data, error } = await sb
    .from('asset')
    .update({ ...assetColumns(body), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
  const paths = await loadFolderPaths(sb);
  return toAsset(data, assetFolderPath(paths, data.folder_id));
});
