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
// (`assetQuery` body + BatchQueryResult envelope). Studio fetches everything via
// `all: true` (the real schema caps `pageSize` at 1000) and paginates/sorts/
// searches client-side via TanStack, so this returns every matching row within
// the folder scope in one page rather than doing real server-side paging.
// cutover: swap to the real endpoint; see docs/domains/assets-cutover.md.
export default defineEventHandler(
  async (event): Promise<BatchQueryResult<Asset>> => {
    const body =
      (await readBody<{
        page?: number;
        pageSize?: number;
        all?: boolean;
        folderIds?: (string | null)[];
      }>(event)) ?? {};
    const sb = assetMockSupabase();

    let query = sb
      .from('asset')
      .select('*')
      .order('updated_at', { ascending: false });

    // Folder scope stays server-side (mirrors the real `assetQuery.folderIds`):
    // each entry is the NULL bucket (null / Uncategorised = root) or a folder's
    // subtree; the union is applied. No `folderIds` = every folder (all assets).
    const folderIds = body.folderIds ?? [];
    if (folderIds.length) {
      const wantsRoot = folderIds.some(
        (id) => resolveAssetFolderFilter(id) === 'null',
      );
      const subtreeRoots = folderIds.filter(
        (id): id is string => resolveAssetFolderFilter(id) === 'descendants',
      );
      let descendantIds: string[] = [];
      if (subtreeRoots.length) {
        const { data: folders, error: fErr } = await sb
          .from('folder')
          .select('id,parent_id');
        if (fErr)
          throw createError({ statusCode: 502, statusMessage: fErr.message });
        descendantIds = subtreeRoots.flatMap((id) =>
          descendantFolderIds(folders ?? [], id),
        );
      }
      if (wantsRoot && descendantIds.length) {
        query = query.or(
          `folder_id.is.null,folder_id.in.(${descendantIds.join(',')})`,
        );
      } else if (wantsRoot) {
        query = query.is('folder_id', null);
      } else if (descendantIds.length) {
        query = query.in('folder_id', descendantIds);
      }
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
