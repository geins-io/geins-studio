/**
 * Asset storage usage — the quota bar + the breakdown shown in the storage
 * panel. Phase-2 API data; **mocked** here (static, representative numbers)
 * behind this composable so cutover is a pure data swap. See the Post-v0
 * milestone / [[project_assets_library]].
 */

export interface StorageSegment {
  key: string;
  /** Display label (i18n-resolved for types; folder name for folders). */
  label: string;
  bytes: number;
  /** Tailwind fill colour for the segment's Progress bar. */
  indicatorClass: string;
}

export interface AssetStorage {
  usedBytes: number;
  totalBytes: number;
  byType: StorageSegment[];
  byFolder: StorageSegment[];
}

export interface UseAssetStorageReturnType {
  storage: ComputedRef<AssetStorage>;
}

const GB = 1024 ** 3;
const TB = 1024 ** 4;

export function useAssetStorage(): UseAssetStorageReturnType {
  const { t } = useI18n();

  const storage = computed<AssetStorage>(() => ({
    usedBytes: Math.round(1.64 * TB),
    totalBytes: 2 * TB,
    byType: [
      {
        key: 'images',
        label: t('asset_library.storage.images'),
        bytes: 812 * GB,
        indicatorClass: 'bg-sky-500',
      },
      {
        key: 'video',
        label: t('asset_library.storage.video'),
        bytes: 640 * GB,
        indicatorClass: 'bg-violet-500',
      },
      {
        key: 'documents',
        label: t('asset_library.storage.documents'),
        bytes: 138 * GB,
        indicatorClass: 'bg-indigo-400',
      },
      {
        key: 'other',
        label: t('asset_library.storage.other'),
        bytes: 47 * GB,
        indicatorClass: 'bg-muted-foreground/40',
      },
    ],
    byFolder: [
      {
        key: 'marketing',
        label: 'Marketing',
        bytes: 980 * GB,
        indicatorClass: 'bg-primary/80',
      },
      {
        key: 'product-images',
        label: 'Product images',
        bytes: 410 * GB,
        indicatorClass: 'bg-primary/60',
      },
      {
        key: 'brand',
        label: 'Brand',
        bytes: 247 * GB,
        indicatorClass: 'bg-primary/40',
      },
    ],
  }));

  return { storage };
}
