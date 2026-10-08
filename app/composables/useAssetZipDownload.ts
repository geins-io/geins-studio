import { h } from 'vue';
import type { Asset } from '#shared/types';
import { ASSET_ZIP_MAX_BYTES } from '#shared/utils/asset';
import { formatFileSize } from '#shared/utils/file';
import { buildZip, zipFileName } from '#shared/utils/zip';
import { Progress } from '@/components/ui/progress';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/toast/use-toast';
import type { Ref } from 'vue';

export interface UseAssetZipDownloadReturnType {
  /** True while a zip is being prepared. */
  downloading: Readonly<Ref<boolean>>;
  /** Fetch the assets, zip them flat and save `assets-YYYY-MM-DD.zip`. */
  downloadZip: (assets: Asset[]) => Promise<void>;
  /** Abort the zip in progress. Nothing is saved. */
  cancel: () => void;
}

/** Save a blob under `fileName`. Same-origin object URLs honour `download`. */
function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking right away can cut off a large download before it starts.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Bulk download as one zip, built in the browser (the CDN allows cross-origin
 * `fetch`). Refuses selections over `ASSET_ZIP_MAX_BYTES`. Progress lives in a
 * toast that stays open until done; its Cancel, close button or a swipe abort
 * the run. Files that fail (or have no `url`) are skipped and counted.
 */
export function useAssetZipDownload(): UseAssetZipDownloadReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const { geinsLogError } = useGeinsLog('composables/useAssetZipDownload');

  const downloading = ref(false);
  let controller: AbortController | null = null;

  const cancel = () => controller?.abort();

  function progressDescription(done: number, total: number) {
    return h('div', { class: 'grid w-64 gap-2' }, [
      h('span', t('asset_library.download_progress', { done, total })),
      h(Progress, {
        modelValue: total ? Math.round((done / total) * 100) : 0,
        class: 'h-1.5',
      }),
    ]);
  }

  async function downloadZip(assets: Asset[]) {
    if (downloading.value || !assets.length) return;

    const totalBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
    if (totalBytes > ASSET_ZIP_MAX_BYTES) {
      toast({
        title: t('asset_library.download_too_large'),
        description: t('asset_library.download_too_large_description', {
          max: formatFileSize(ASSET_ZIP_MAX_BYTES),
          size: formatFileSize(totalBytes),
        }),
        variant: 'negative',
      });
      return;
    }

    const sources = assets.flatMap((asset) =>
      asset.url ? [{ name: asset.name, url: asset.url }] : [],
    );
    const total = assets.length;
    const missing = total - sources.length;

    downloading.value = true;
    controller = new AbortController();
    const { signal } = controller;
    const progress = toast({
      title: t('asset_library.download_preparing'),
      description: progressDescription(missing, total),
      duration: Infinity,
      action: () => h(ToastAction, { altText: t('cancel') }, () => t('cancel')),
      onOpenChange: (open) => {
        if (!open) cancel();
      },
    });

    try {
      const result = await buildZip(sources, {
        signal,
        onProgress: (done) =>
          progress.update({
            id: progress.id,
            description: progressDescription(missing + done, total),
          }),
      });
      // Detach cancel first: closing the toast reports `open: false` too.
      const cancelled = signal.aborted;
      controller = null;
      progress.dismiss();
      if (cancelled) return;

      for (const { name, error } of result.failed) {
        geinsLogError('downloadZip', name, getErrorMessage(error));
      }
      if (!result.blob) {
        toast({
          title: t('asset_library.download_failed'),
          variant: 'negative',
        });
        return;
      }
      saveBlob(result.blob, zipFileName('assets'));
      const failed = result.failed.length + missing;
      if (failed) {
        toast({
          title: t('asset_library.download_partial', { count: failed }, failed),
          variant: 'warning',
        });
      }
    } catch (error) {
      progress.dismiss();
      geinsLogError('downloadZip', getErrorMessage(error));
      toast({ title: t('asset_library.download_failed'), variant: 'negative' });
    } finally {
      downloading.value = false;
      controller = null;
    }
  }

  return { downloading: readonly(downloading), downloadZip, cancel };
}
