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
    labelKey: 'asset_library.asset_type.image',
    variant: 'info',
    icon: 'Image',
    tint: 'bg-tone-info/10 text-tone-info',
  },
  svg: {
    labelKey: 'asset_library.asset_type.svg',
    variant: 'teal',
    icon: 'Shapes',
    tint: 'bg-tone-teal/10 text-tone-teal',
  },
  doc: {
    labelKey: 'asset_library.asset_type.doc',
    variant: 'slate',
    icon: 'FileText',
    tint: 'bg-tone-slate/10 text-tone-slate',
  },
  pdf: {
    labelKey: 'asset_library.asset_type.pdf',
    variant: 'pink',
    icon: 'FileText',
    tint: 'bg-tone-pink/10 text-tone-pink',
  },
  video: {
    labelKey: 'asset_library.asset_type.video',
    variant: 'purple',
    icon: 'Film',
    tint: 'bg-tone-purple/10 text-tone-purple',
  },
  audio: {
    labelKey: 'asset_library.asset_type.audio',
    variant: 'warning',
    icon: 'Music',
    tint: 'bg-tone-warning-bg text-tone-warning',
  },
  other: {
    labelKey: 'asset_library.asset_type.other',
    variant: 'neutral',
    icon: 'File',
    tint: 'bg-tone-neutral/10 text-tone-neutral-foreground',
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
