/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAsset } from '../../../test/fixtures';

const { assetApi, toast, refreshNuxtData, geinsLogError } = vi.hoisted(() => ({
  assetApi: { delete: vi.fn() },
  toast: vi.fn(),
  refreshNuxtData: vi.fn(),
  geinsLogError: vi.fn(),
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError }));
mockNuxtImport('refreshNuxtData', () => refreshNuxtData);

vi.mock('@/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}));

import { useAssetActions } from '../useAssetActions';

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAssetActions — copyUrl', () => {
  it('writes the url to the clipboard and toasts', async () => {
    const { copyUrl } = useAssetActions();
    await copyUrl(buildAsset({ url: 'https://cdn/x.jpg' }));
    expect(writeText).toHaveBeenCalledWith('https://cdn/x.jpg');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'positive' }),
    );
  });

  it('is a no-op when the asset has no url', async () => {
    const { copyUrl } = useAssetActions();
    await copyUrl(buildAsset({ url: null }));
    expect(writeText).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
});

describe('useAssetActions — download', () => {
  it('clicks an anchor pointing at the file url', () => {
    const click = vi.fn();
    const anchor = {
      click,
      href: '',
      download: '',
      target: '',
      rel: '',
      remove: vi.fn(),
    };
    const createEl = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);

    const { download } = useAssetActions();
    download(buildAsset({ url: 'https://cdn/x.jpg', name: 'x.jpg' }));

    expect(anchor.href).toBe('https://cdn/x.jpg');
    expect(anchor.download).toBe('x.jpg');
    expect(click).toHaveBeenCalled();
    createEl.mockRestore();
  });

  it('is a no-op when the asset has no url', () => {
    const createEl = vi.spyOn(document, 'createElement');
    const { download } = useAssetActions();
    download(buildAsset({ url: null }));
    expect(createEl).not.toHaveBeenCalled();
    createEl.mockRestore();
  });
});

describe('useAssetActions — deleteAsset', () => {
  it('deletes, refreshes the library, toasts and returns true', async () => {
    assetApi.delete.mockResolvedValue(undefined);
    const { deleteAsset } = useAssetActions();
    const ok = await deleteAsset(buildAsset({ _id: 'a9' }));

    expect(ok).toBe(true);
    expect(assetApi.delete).toHaveBeenCalledWith('a9');
    expect(refreshNuxtData).toHaveBeenCalledWith('asset-library-list');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'positive' }),
    );
  });

  it('returns false and logs when the delete fails', async () => {
    assetApi.delete.mockRejectedValue(new Error('boom'));
    const { deleteAsset } = useAssetActions();
    const ok = await deleteAsset(buildAsset());

    expect(ok).toBe(false);
    expect(geinsLogError).toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
});
