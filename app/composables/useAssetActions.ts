import type { Asset } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UseAssetActionsReturnType {
  /** Copy the asset's public `url` to the clipboard (+ toast). No-op if unset. */
  copyUrl: (asset: Asset) => Promise<void>;
  /** Download the file from its `url` (new-tab fallback). No-op if unset. */
  download: (asset: Asset) => void;
  /** Delete the asset, refresh the library list, toast. Returns success. */
  deleteAsset: (asset: Asset) => Promise<boolean>;
}

/**
 * Shared asset row/panel actions (copy URL, download, delete) so the library
 * page, grid card, and detail panel stay consistent. Delete refreshes the
 * `asset-library-list` read; callers own their confirm dialog + surrounding UI
 * (closing a panel, clearing selection).
 */
export function useAssetActions(): UseAssetActionsReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const { assetApi } = useGeinsRepository();
  const { geinsLogError } = useGeinsLog('composables/useAssetActions');
  const entityKey = ENTITIES.asset.key;

  async function copyUrl(asset: Asset) {
    if (!asset.url) return;
    try {
      await navigator.clipboard.writeText(asset.url);
      toast({
        title: t('entity_copied', { entityKey: 'public_url' }),
        variant: 'positive',
      });
    } catch (error) {
      geinsLogError('copyUrl', getErrorMessage(error));
    }
  }

  function download(asset: Asset) {
    if (!asset.url) return;
    // Anchor download; cross-origin storage URLs fall back to opening in a tab.
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function deleteAsset(asset: Asset): Promise<boolean> {
    try {
      await assetApi.delete(asset._id);
      await refreshNuxtData('asset-library-list');
      toast({ title: t('entity_deleted', { entityKey }), variant: 'positive' });
      return true;
    } catch (error) {
      geinsLogError('deleteAsset', getErrorMessage(error));
      return false;
    }
  }

  return { copyUrl, download, deleteAsset };
}
