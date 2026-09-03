import { defineEventHandler, readBody, createError } from 'h3';
import {
  assetMockSupabase,
  folderColumns,
  loadFolderPaths,
  toFolder,
} from '../../../utils/assets-mock';

// POST /api/asset/folder — repo `folder.create()`. `system` is never
// user-settable (DB default false), so only name/parentFolderId/sortOrder are mapped.
export default defineEventHandler(async (event) => {
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const sb = assetMockSupabase();
  const { data, error } = await sb
    .from('folder')
    .insert(folderColumns(body))
    .select('*')
    .single();
  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  const paths = await loadFolderPaths(sb);
  return toFolder(data, paths.get(data.id));
});
