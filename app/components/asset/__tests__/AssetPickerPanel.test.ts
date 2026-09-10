/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAsset } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { list: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));

mockNuxtImport('useFolders', () => () => ({
  folders: { value: [] },
  userFolders: { value: [] },
  systemFolders: { value: [] },
  tree: { value: [] },
  folderName: () => 'Marketing',
  descendantIds: () => [],
  loading: { value: false },
  error: { value: null },
  refresh: vi.fn(),
}));

import AssetPickerPanel from '../AssetPickerPanel.vue';

const IMG = buildAsset({ _id: 'img-1', name: 'hero.jpg', type: 'image' });
const IMG2 = buildAsset({ _id: 'img-2', name: 'side.jpg', type: 'image' });
const PDF = buildAsset({ _id: 'pdf-1', name: 'manual.pdf', type: 'pdf' });

// Stub the heavy children — this suite exercises the panel's selection /
// filtering / confirm logic, not the tree or the table rendering. SheetContent
// is stubbed to render inline — the real one teleports to document.body (out of
// the wrapper's reach); the real Sheet stays so SheetTitle keeps its context.
const stubs = {
  AssetFolderTree: true,
  TableView: true,
  PaginationBar: true,
  SheetContent: { template: '<div><slot /></div>' },
};

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  assetApi.list.mockReset();
  assetApi.list.mockResolvedValue([IMG, IMG2, PDF]);
});

describe('AssetPickerPanel', () => {
  it('fetches the library when opened', async () => {
    await mountWithContext(AssetPickerPanel, {
      props: { open: true },
      global: { stubs },
    });
    await flush();
    expect(assetApi.list).toHaveBeenCalled();
  });

  it('confirms only the picked assets and disables Add until something new is picked', async () => {
    const panel = await mountWithContext(AssetPickerPanel, {
      props: { open: true },
      global: { stubs },
    });
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    expect(addButton.attributes('disabled')).toBeDefined();

    // Toggle the first card (AssetCard emits toggle-select from its checkbox).
    const firstCheckbox = panel.find('[data-slot="checkbox"]');
    await firstCheckbox.trigger('click');
    await flush();

    expect(addButton.attributes('disabled')).toBeUndefined();

    await addButton.trigger('click');
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]!._id).toBe('img-1');
  });

  it('single-select replaces the previous pick', async () => {
    const panel = await mountWithContext(AssetPickerPanel, {
      props: { open: true, multiple: false },
      global: { stubs },
    });
    await flush();

    const checkboxes = panel.findAll('[data-slot="checkbox"]');
    await checkboxes[0]!.trigger('click');
    await flush();
    await checkboxes[1]!.trigger('click');
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    await addButton.trigger('click');
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]!._id).toBe('img-2');
  });

  it('filters out assets outside the allowed types', async () => {
    const panel = await mountWithContext(AssetPickerPanel, {
      props: { open: true, types: ['image'] },
      global: { stubs },
    });
    await flush();
    // Only the two image cards render — the PDF is filtered out entirely.
    expect(panel.findAll('[data-slot="checkbox"]')).toHaveLength(2);
  });
});
