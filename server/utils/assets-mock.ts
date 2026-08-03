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
  alt_text: Record<string, string> | null;
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
export function toAsset(row: AssetRow): Asset {
  return {
    _id: row.id,
    _type: 'asset',
    name: row.name,
    type: row.type,
    folderId: row.folder_id,
    description: row.description,
    altText: row.alt_text ?? {},
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

export function toFolder(row: FolderRow): Folder {
  return {
    _id: row.id,
    _type: 'folder',
    name: row.name,
    parentId: row.parent_id,
    system: row.system,
    sortOrder: row.sort_order,
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
  if ('altText' in body) row.alt_text = body.altText;
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
