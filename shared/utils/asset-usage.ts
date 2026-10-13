import type {
  AssetType,
  AssetUsage,
  AssetUsageAssetType,
  AssetUsageRange,
  AssetUsageStorage,
} from '#shared/types';
import { ROOT_FOLDER_KEY } from './asset';

/** The storage panel's four type rows; the API's seven types fold into them. */
export type StorageTypeGroup = 'images' | 'video' | 'documents' | 'other';

export const STORAGE_TYPE_GROUPS: readonly StorageTypeGroup[] = [
  'images',
  'video',
  'documents',
  'other',
];

const TYPE_GROUP: Record<AssetType, StorageTypeGroup> = {
  image: 'images',
  svg: 'images',
  video: 'video',
  doc: 'documents',
  pdf: 'documents',
  audio: 'other',
  other: 'other',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Today and the six days before it, in UTC. A today-only range reads zero
 * until the hourly job has read today; a week falls back to the latest reading.
 */
export function assetUsageRange(now: Date = new Date()): AssetUsageRange {
  return {
    from: utcDay(new Date(now.getTime() - 6 * DAY_MS)),
    to: utcDay(now),
  };
}

/** Share of the limit used, capped at 100; `null` for an account with no limit. */
export function storageUsedPct(
  storage: Pick<AssetUsageStorage, 'bytes' | 'limitBytes'>,
): number | null {
  const { bytes, limitBytes } = storage;
  if (limitBytes === null || limitBytes === undefined) return null;
  if (limitBytes <= 0) return bytes > 0 ? 100 : 0;
  return Math.min(100, Math.round((bytes / limitBytes) * 100));
}

/** Whole-percent share of `total`; `0` when there is no total. */
export function usageShare(bytes: number, total: number): number {
  return total > 0 ? Math.round((bytes / total) * 100) : 0;
}

export interface UsageTypeRow {
  group: StorageTypeGroup;
  bytes: number;
}

/**
 * Folds the API's asset types into the panel's groups, largest first. A type
 * this release does not name counts as `other`; empty groups are left out.
 */
export function groupUsageByType(
  assetTypes: readonly AssetUsageAssetType[],
): UsageTypeRow[] {
  const totals = new Map<StorageTypeGroup, number>();
  for (const { type, bytes } of assetTypes) {
    const group = TYPE_GROUP[type as AssetType] ?? 'other';
    totals.set(group, (totals.get(group) ?? 0) + bytes);
  }
  return STORAGE_TYPE_GROUPS.map((group) => ({
    group,
    bytes: totals.get(group) ?? 0,
  }))
    .filter((row) => row.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);
}

export interface UsageFolderRow {
  /** Folder id, or `ROOT_FOLDER_KEY` for the files in no folder. */
  key: string;
  /** Folder name; `null` for the files in no folder (labelled by the caller). */
  name: string | null;
  bytes: number;
}

/**
 * Root folders plus a row for the files in no folder, largest first, so the
 * rows add up to `root.totalBytes`. Empty folders are left out.
 */
export function usageFolderRows(
  usage: Pick<AssetUsage, 'folders' | 'root'>,
): UsageFolderRow[] {
  const rows: UsageFolderRow[] = usage.folders.map((folder) => ({
    key: folder._id,
    name: folder.name,
    bytes: folder.bytes,
  }));
  if (usage.root?.directBytes) {
    rows.push({
      key: ROOT_FOLDER_KEY,
      name: null,
      bytes: usage.root.directBytes,
    });
  }
  return rows.filter((row) => row.bytes > 0).sort((a, b) => b.bytes - a.bytes);
}
