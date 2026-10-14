import type { AssetLabelKind, AssetLabelLimitBreach } from '#shared/types';
import {
  ASSET_LABEL_ENTITY_KEYS,
  ASSET_LABEL_LIMITS,
} from '#shared/utils/asset';

export interface UseAssetLabelLimitsReturnType {
  limitMessage: (
    breach: AssetLabelLimitBreach | null,
    kind: AssetLabelKind,
  ) => string | undefined;
}

/**
 * Inline copy for a tag / channel / content-language list that breaks a backend
 * limit. Same keys as the detail panel's validation, so every surface that
 * checks the limits words them the same way.
 */
export function useAssetLabelLimits(): UseAssetLabelLimitsReturnType {
  const { t } = useI18n();

  function limitMessage(
    breach: AssetLabelLimitBreach | null,
    kind: AssetLabelKind,
  ): string | undefined {
    if (!breach) return undefined;
    const entityKey = ASSET_LABEL_ENTITY_KEYS[kind];
    const { maxCount, maxLength } = ASSET_LABEL_LIMITS[kind];
    return breach === 'count'
      ? t('max_count_entity', { entityKey, max: maxCount }, 2)
      : t('max_length_entity', { entityKey, max: maxLength });
  }

  return { limitMessage };
}
