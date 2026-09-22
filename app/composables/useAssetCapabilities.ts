import type { AssetCapabilities } from '#shared/types';
import { assetCapabilities } from '#shared/utils/asset';

/**
 * Which Assets Library features are available on the shipped Geins.Media
 * surface. Gate the tag, channel and replace controls on these so what phase 1
 * can't fulfil disables cleanly instead of erroring.
 *
 * cutover: REVISIT@phase2 — temporary gating; remove this composable and every
 * `useAssetCapabilities()` consumer once phase 2 restores the features. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function useAssetCapabilities(): AssetCapabilities {
  return assetCapabilities();
}

export type UseAssetCapabilitiesReturnType = AssetCapabilities;
