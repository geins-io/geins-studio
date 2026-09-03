import { defineEventHandler, readBody, createError } from 'h3';
import type { Asset, BatchQueryResult } from '#shared/types';
import {
  assetFolderPath,
  assetMockSupabase,
  descendantFolderIds,
  loadFolderPaths,
  resolveAssetFolderFilter,
  toAsset,
} from '../../utils/assets-mock';

// POST /api/asset/query — repo `list()`. Mirrors the real POST /media/assets/query
// (BatchQueryResult envelope). Studio fetches everything (huge pageSize, per the
// app-wide batch convention) and paginates/sorts/searches client-side via
// TanStack, so this returns every matching row within the folder scope in one
// page rather than doing real server-side paging. cutover: swap to the real
// endpoint; see docs/domains/assets-cutover.md.
export default defineEventHandler(
  async (event): Promise<BatchQueryResult<Asset>> => {
    const body =
      (await readBody<{
        page?: number;
        pageSize?: number;
        all?: boolean;
        folderId?: string;
      }>(event)) ?? {};
    const sb = assetMockSupabase();

    let query = sb
      .from('asset')
      .select('*')
      .order('updated_at', { ascending: false });

    // Folder scope stays server-side (matches STU-317): Uncategorised = NULL,
    // any other folder = its subtree.
    const folderFilter = resolveAssetFolderFilter(body.folderId);
    if (folderFilter === 'null') {
      query = query.is('folder_id', null);
    } else if (folderFilter === 'descendants' && body.folderId) {
      const { data: folders, error: fErr } = await sb
        .from('folder')
        .select('id,parent_id');
      if (fErr)
        throw createError({ statusCode: 502, statusMessage: fErr.message });
      query = query.in(
        'folder_id',
        descendantFolderIds(folders ?? [], body.folderId),
      );
    }

    const { data, error } = await query;
    if (error)
      throw createError({ statusCode: 502, statusMessage: error.message });

    const paths = await loadFolderPaths(sb);
    const items = (data ?? []).map((row) =>
      toAsset(row, assetFolderPath(paths, row.folder_id)),
    );

    return {
      _id: 'mock-asset-batch',
      page: body.page ?? 1,
      pageSize: body.pageSize ?? items.length,
      totalItemCount: items.length,
      pageCount: 1,
      items,
    };
  },
);
