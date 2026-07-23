import type { AssetType } from '#shared/types';
import type { BadgeVariants } from '@/components/ui/badge';

/**
 * Single source of presentation metadata for an {@link AssetType} — the i18n
 * label key, the `Badge` color variant, and the Lucide icon name. Grid cards,
 * list rows, type badges, and thumbnails all read from here so they agree.
 */
interface AssetTypeMeta {
  labelKey: string;
  variant: BadgeVariants['variant'];
  icon: string;
  /** Tint classes for the thumbnail placeholder — same color as the badge. */
  tint: string;
}

const ASSET_TYPE_META: Record<AssetType, AssetTypeMeta> = {
  image: {
    labelKey: 'asset_type.image',
    variant: 'blue',
    icon: 'Image',
    tint: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  },
  svg: {
    labelKey: 'asset_type.svg',
    variant: 'teal',
    icon: 'Shapes',
    tint: 'bg-teal-500/15 text-teal-600 dark:text-teal-300',
  },
  doc: {
    labelKey: 'asset_type.doc',
    variant: 'indigo',
    icon: 'FileText',
    tint: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  },
  pdf: {
    labelKey: 'asset_type.pdf',
    variant: 'rose',
    icon: 'FileText',
    tint: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  },
  video: {
    labelKey: 'asset_type.video',
    variant: 'purple',
    icon: 'Film',
    tint: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  },
  audio: {
    labelKey: 'asset_type.audio',
    variant: 'amber',
    icon: 'Music',
    tint: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  },
  other: {
    labelKey: 'asset_type.other',
    variant: 'slate',
    icon: 'File',
    tint: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  },
};

export interface UseAssetTypeReturn {
  meta: (type: AssetType) => AssetTypeMeta;
  label: (type: AssetType) => string;
}

export function useAssetType(): UseAssetTypeReturn {
  const { t } = useI18n();
  const meta = (type: AssetType): AssetTypeMeta =>
    ASSET_TYPE_META[type] ?? ASSET_TYPE_META.other;
  const label = (type: AssetType): string => t(meta(type).labelKey);
  return { meta, label };
}
