import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createError } from 'h3';
import type { Asset, AssetType, Folder } from '#shared/types';
import { useRuntimeConfig } from '#imports';

/**
 * Server-only helpers for the Assets Library mock backend (STU-266).
 *
 * The Geins Management API JSON is camelCase + `_id`/`_type`; the Supabase
 * tables are idiomatic snake_case. These mappers are the contract boundary —
 * routes NEVER return raw rows. When the real API serves `/asset`, delete
 * `server/api/asset/*` + this file and the catch-all proxy takes over with no
 * repo/UI change (see docs/domains/assets.md).
 */

// Default language for deriving the top-level `altText` from `localizations`
// (mirrors how a channel default resolves the inline value in the real API).
const DEFAULT_LANG = 'en';

// ── Supabase client (secret/service_role key — bypasses RLS, never client-side)
let client: SupabaseClient | null = null;

export function assetMockSupabase(): SupabaseClient {
  if (client) return client;
  const { private: cfg } = useRuntimeConfig();
  const url = cfg.supabaseUrl as string | undefined;
  const key = cfg.supabaseServiceKey as string | undefined;
  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Assets mock not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY',
    });
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// ── Row shapes (snake_case, as stored) ───────────────────────────────────────
export interface AssetRow {
  id: string;
  name: string;
  type: AssetType;
  folder_id: string | null;
  size_bytes: number;
  mime: string | null;
  url: string | null;
  thumb_url: string | null;
  description: string | null;
  localizations: Record<string, { altText?: string }> | null;
  tags: string[] | null;
  channels: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
  system: boolean;
  sort_order: number;
  created_at: string;
}

// ── Row → contract mappers ────────────────────────────────────────────────────
export function toAsset(
  row: AssetRow,
  folderPath: string | null = null,
): Asset {
  return {
    _id: row.id,
    _type: 'geins.asset',
    name: row.name,
    type: row.type,
    folderId: row.folder_id,
    // Path mirrors the real API: folder's full path + file name (just the name
    // for a root asset). folderPath feeds the breadcrumb.
    folderPath,
    path: folderPath ? `${folderPath}/${row.name}` : row.name,
    description: row.description,
    localizations: row.localizations ?? {},
    // Default-language value surfaced inline (derived; source of truth is localizations).
    altText: row.localizations?.[DEFAULT_LANG]?.altText ?? null,
    tags: row.tags ?? [],
    channels: row.channels ?? [],
    sizeBytes: row.size_bytes,
    mime: row.mime,
    url: row.url,
    thumbUrl: row.thumb_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toFolder(
  row: FolderRow,
  meta?: { fullPath: string; depth: number },
): Folder {
  return {
    _id: row.id,
    _type: 'folder',
    name: row.name,
    parentId: row.parent_id,
    system: row.system,
    sortOrder: row.sort_order,
    // Derived from the tree; default to a top-level folder when no map is given.
    fullPath: meta?.fullPath ?? row.name,
    depth: meta?.depth ?? 1,
    createdAt: row.created_at,
  };
}

// ── Contract body → row columns (only touch provided keys; PATCH is partial) ──
export function assetColumns(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('name' in body) row.name = body.name;
  if ('type' in body) row.type = body.type;
  if ('folderId' in body) row.folder_id = body.folderId;
  if ('description' in body) row.description = body.description;
  if ('localizations' in body) row.localizations = body.localizations;
  if ('tags' in body) row.tags = body.tags;
  if ('channels' in body) row.channels = body.channels;
  return row;
}

export function folderColumns(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('name' in body) row.name = body.name;
  if ('parentId' in body) row.parent_id = body.parentId;
  if ('sortOrder' in body) row.sort_order = body.sortOrder;
  return row;
}

/**
 * Distinct, sorted tag set across the given asset rows — the source for the
 * tag-input suggestions. Trims blanks and de-dupes case-sensitively (tags are
 * stored as authored).
 */
export function distinctSortedTags(rows: Pick<AssetRow, 'tags'>[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const tag of row.tags ?? []) {
      const trimmed = tag.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * The seed "Uncategorised" system folder. It owns no asset rows of its own:
 * assets with `folder_id IS NULL` ARE uncategorised (folder delete re-homes
 * them here via the FK `ON DELETE SET NULL`). Filtering by this id must
 * therefore match NULL, not the id — otherwise the Uncategorised view is
 * always empty even after assets have been moved into it.
 */
export const UNCATEGORISED_FOLDER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * How to filter assets for a selected folder id: no filter, the NULL-folder
 * bucket (Uncategorised), or the folder's own subtree. See
 * {@link UNCATEGORISED_FOLDER_ID} for why Uncategorised maps to NULL.
 */
export function resolveAssetFolderFilter(
  folderId: string | undefined,
): 'none' | 'null' | 'descendants' {
  if (!folderId) return 'none';
  if (folderId === UNCATEGORISED_FOLDER_ID) return 'null';
  return 'descendants';
}

/**
 * Full path + depth per folder, built from the adjacency list: walk each
 * folder's parent chain to the root and join the names. `fullPath` mirrors the
 * real API's folder path (the leading part of an asset's `path`); `depth` is the
 * segment count (1 = top level). Cycle-guarded, though seed data has none.
 */
export function folderPathIndex(
  folders: Pick<FolderRow, 'id' | 'parent_id' | 'name'>[],
): Map<string, { fullPath: string; depth: number }> {
  const byId = new Map<string, Pick<FolderRow, 'id' | 'parent_id' | 'name'>>(
    folders.map((f) => [f.id, f]),
  );
  const out = new Map<string, { fullPath: string; depth: number }>();
  for (const folder of folders) {
    const segments: string[] = [];
    const seen = new Set<string>();
    let cur: string | null = folder.id;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const node = byId.get(cur);
      if (!node) break;
      segments.unshift(node.name);
      cur = node.parent_id;
    }
    out.set(folder.id, {
      fullPath: segments.join('/'),
      depth: segments.length,
    });
  }
  return out;
}

/** An asset's folder path from a {@link folderPathIndex}; `null` at the root. */
export function assetFolderPath(
  paths: Map<string, { fullPath: string; depth: number }>,
  folderId: string | null,
): string | null {
  return folderId ? (paths.get(folderId)?.fullPath ?? null) : null;
}

/**
 * Fetch every folder and index it by path — the shared source for stamping
 * `fullPath`/`depth` on folders and `folderPath`/`path` on assets in the route
 * handlers (a single small query per request; the folder set is tiny).
 */
export async function loadFolderPaths(
  sb: SupabaseClient,
): Promise<Map<string, { fullPath: string; depth: number }>> {
  const { data, error } = await sb.from('folder').select('id,parent_id,name');
  if (error)
    throw createError({ statusCode: 502, statusMessage: error.message });
  return folderPathIndex(data ?? []);
}

/**
 * Folder-as-category filter: given the full folder set and a selected folder,
 * return that folder plus every descendant id (iterative DFS over the
 * adjacency list). Keeps folder filtering server-side, no client tree math.
 */
export function descendantFolderIds(
  folders: Pick<FolderRow, 'id' | 'parent_id'>[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string | null, string[]>();
  for (const f of folders) {
    const siblings = childrenByParent.get(f.parent_id) ?? [];
    siblings.push(f.id);
    childrenByParent.set(f.parent_id, siblings);
  }
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop() as string;
    out.push(id);
    for (const child of childrenByParent.get(id) ?? []) stack.push(child);
  }
  return out;
}
