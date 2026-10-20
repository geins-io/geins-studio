import type { AssetUsage } from '#shared/types';
import {
  assetUsageRange,
  groupUsageByType,
  storageUsedPct,
  usageFolderRows,
  usageShare,
  type StorageTypeGroup,
} from '#shared/utils/asset-usage';

/**
 * Asset storage usage from `GET media/usage` — the header quota bar and the
 * breakdown in the storage panel. Every caller shares the `asset-usage` fetch.
 */

export interface StorageSegment {
  key: string;
  /** Display label (i18n-resolved for types; folder name for folders). */
  label: string;
  bytes: number;
  /** Whole-percent share of the breakdown total. */
  pct: number;
  /** Tailwind fill colour for the segment's Progress bar. */
  indicatorClass: string;
}

export interface AssetStorage {
  usedBytes: number;
  /** The account's limit; `null` when it has none. */
  totalBytes: number | null;
  /** Share of the limit used, capped at 100; `null` when there is no limit. */
  usedPct: number | null;
  /** When the breakdown was last calculated; `null` = never, lists empty. */
  breakdownReadAt: string | null;
  byType: StorageSegment[];
  byFolder: StorageSegment[];
}

export interface UseAssetStorageReturnType {
  /** `null` until the first read lands, and after a failed one. */
  storage: ComputedRef<AssetStorage | null>;
  pending: Ref<boolean>;
  error: Ref<unknown>;
  refresh: () => Promise<void>;
}

const TYPE_INDICATOR: Record<StorageTypeGroup, string> = {
  images: 'bg-sky-500',
  video: 'bg-violet-500',
  documents: 'bg-indigo-400',
  other: 'bg-muted-foreground/40',
};

// Full class strings so Tailwind sees them; rows past the last share it.
const FOLDER_INDICATORS = [
  'bg-primary/80',
  'bg-primary/70',
  'bg-primary/60',
  'bg-primary/50',
  'bg-primary/40',
  'bg-primary/30',
];

export function useAssetStorage(): UseAssetStorageReturnType {
  const { t } = useI18n();
  const { assetApi } = useGeinsRepository();

  // The range is built per call so a refresh after midnight UTC moves with it.
  const { data, pending, error, refresh } = useAsyncData<AssetUsage>(
    'asset-usage',
    () => assetApi.usage(assetUsageRange()),
  );

  const storage = computed<AssetStorage | null>(() => {
    const usage = data.value;
    if (!usage) return null;
    const total = usage.root?.totalBytes ?? 0;
    return {
      usedBytes: usage.storage.bytes,
      totalBytes: usage.storage.limitBytes ?? null,
      usedPct: storageUsedPct(usage.storage),
      breakdownReadAt: usage.breakdownReadAt ?? null,
      byType: groupUsageByType(usage.assetTypes ?? []).map((row) => ({
        key: row.group,
        label: t(`asset_library.storage.${row.group}`),
        bytes: row.bytes,
        pct: usageShare(row.bytes, total),
        indicatorClass: TYPE_INDICATOR[row.group],
      })),
      byFolder: usageFolderRows({
        folders: usage.folders ?? [],
        root: usage.root ?? null,
      }).map((row, rank) => ({
        key: row.key,
        label: row.name ?? t('asset_library.uncategorised'),
        bytes: row.bytes,
        pct: usageShare(row.bytes, total),
        indicatorClass:
          FOLDER_INDICATORS[Math.min(rank, FOLDER_INDICATORS.length - 1)]!,
      })),
    };
  });

  return { storage, pending, error, refresh };
}
