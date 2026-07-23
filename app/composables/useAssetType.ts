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
}

const ASSET_TYPE_META: Record<AssetType, AssetTypeMeta> = {
  image: { labelKey: 'asset_type.image', variant: 'blue', icon: 'Image' },
  svg: { labelKey: 'asset_type.svg', variant: 'teal', icon: 'Shapes' },
  doc: { labelKey: 'asset_type.doc', variant: 'indigo', icon: 'FileText' },
  pdf: { labelKey: 'asset_type.pdf', variant: 'rose', icon: 'FileText' },
  video: { labelKey: 'asset_type.video', variant: 'purple', icon: 'Film' },
  audio: { labelKey: 'asset_type.audio', variant: 'amber', icon: 'Music' },
  other: { labelKey: 'asset_type.other', variant: 'slate', icon: 'File' },
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
