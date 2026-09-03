import type { AssetCapabilities, AssetsBackend } from '#shared/types';
import { assetCapabilities } from '#shared/utils/asset';

/**
 * Which Assets Library features are available, derived from the configured
 * backend (`public.assetsBackend`). Gate metadata editing, delete, replace, and
 * tag autocomplete on these so the UI degrades cleanly against the real
 * Geins.Media phase-1 API (browse + upload only) while the Supabase mock keeps
 * everything on.
 *
 * cutover: REVISIT@phase2 — temporary gating; remove this composable and every
 * `useAssetCapabilities()` consumer once phase 2 restores the features. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function useAssetCapabilities(): AssetCapabilities {
  const backend = useRuntimeConfig().public.assetsBackend as AssetsBackend;
  return assetCapabilities(backend);
}

export type UseAssetCapabilitiesReturnType = AssetCapabilities;
