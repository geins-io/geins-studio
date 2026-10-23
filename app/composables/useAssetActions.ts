import type { Asset } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UseAssetActionsReturnType {
  /** Copy the asset's public `url` to the clipboard (+ toast). No-op if unset. */
  copyUrl: (asset: Asset) => Promise<void>;
  /** Download the file from its `url` (new-tab fallback). No-op if unset. */
  download: (asset: Asset) => void;
  /**
   * Move the asset to trash, toast, and start a library-list refresh without
   * awaiting it. Returns success.
   */
  deleteAsset: (asset: Asset) => Promise<boolean>;
  /**
   * Restore a trashed asset, toast, and start a library-list refresh without
   * awaiting it. Returns success.
   */
  restoreAsset: (asset: Asset) => Promise<boolean>;
  /**
   * Purge a trashed asset as a background job, which refreshes the library
   * list and toasts once the purge lands. Returns whether the call went through.
   */
  purgeAsset: (asset: Asset) => Promise<boolean>;
}

/**
 * Shared asset row/panel actions (copy URL, download, delete, restore, purge)
 * so the library page, grid card, and detail panel stay consistent. Delete,
 * restore and purge refresh the `asset-library-list` read (purge once its job
 * lands). Delete and restore resolve as soon as the call succeeds, without
 * waiting for that refetch, so a caller can close its dialog or panel at once.
 * Callers own their confirm dialog + surrounding UI (closing a panel, clearing
 * selection).
 */
export function useAssetActions(): UseAssetActionsReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const { assetApi } = useGeinsRepository();
  const backgroundJobs = useBackgroundJobs();
  const { geinsLogError, geinsLogWarn } = useGeinsLog(
    'composables/useAssetActions',
  );
  const entityKey = ENTITIES.asset.key;

  // Not awaited, so the caller can close its dialog at once. The action has
  // already succeeded, so a failed refetch only logs.
  const refreshAfter = (keys: string | string[]) =>
    void refreshNuxtData(keys).catch((error) =>
      geinsLogWarn('refresh after action failed', error),
    );

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
      refreshAfter('asset-library-list');
      toast({
        title: t('entity_moved_to_trash', { entityKey }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
      geinsLogError('deleteAsset', getErrorMessage(error));
      return false;
    }
  }

  async function restoreAsset(asset: Asset): Promise<boolean> {
    try {
      await assetApi.restore(asset._id);
      // Restoring an asset whose folder is in the trash brings that folder
      // (and any trashed parents) back too.
      refreshAfter([
        'asset-library-list',
        'asset-folders',
        'asset-trash-folders',
      ]);
      toast({
        title: t('entity_restored', { entityKey }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
      geinsLogError('restoreAsset', getErrorMessage(error));
      return false;
    }
  }

  // The purge lands about a minute after the call; until then the trash can
  // still list the asset.
  async function purgeAsset(asset: Asset): Promise<boolean> {
    try {
      await assetApi.bulkPurge([asset._id]);
    } catch (error) {
      geinsLogError('purgeAsset', getErrorMessage(error));
      return false;
    }
    backgroundJobs.start({
      spec: { kind: 'purge', assetIds: [asset._id] },
      label: {
        key: 'asset_library.job_purging_asset',
        params: { name: asset.name },
      },
      doneMessage: { key: 'entity_deleted', params: { entityKey } },
      // Purging a trashed folder's last asset lets the backend reap the folder.
      refreshKeys: ['asset-library-list', 'asset-trash-folders'],
    });
    return true;
  }

  return { copyUrl, download, deleteAsset, restoreAsset, purgeAsset };
}
