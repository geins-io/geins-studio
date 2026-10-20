/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAsset } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { query: vi.fn(), byIds: vi.fn() },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));

mockNuxtImport('useFolders', () => () => ({
  folders: { value: [] },
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

const batch = (items: unknown[]) => ({
  _id: 'b1',
  page: 1,
  pageSize: 24,
  totalItemCount: items.length,
  pageCount: 1,
  items,
});
const lastQuery = () => assetApi.query.mock.calls.at(-1)!;

// Stub the heavy children — this suite exercises the panel's selection /
// query / confirm logic, not the tree or the table rendering. SheetContent
// is stubbed to render inline — the real one teleports to document.body (out of
// the wrapper's reach); the real Sheet stays so SheetTitle keeps its context.
// The upload dialog is stubbed to a button that re-emits `uploaded` with two
// freshly-uploaded images — lets us drive `handleUploaded` without the real
// dropzone/upload flow.
const stubs = {
  AssetFolderTree: true,
  TableView: true,
  PaginationBar: true,
  SheetContent: { template: '<div><slot /></div>' },
  AssetUploadDialog: {
    template:
      '<button data-test="emit-uploaded" @click="$emit(\'uploaded\', payload)" />',
    data: () => ({
      payload: [
        { _id: 'up-1', type: 'image', name: 'new-a.jpg' },
        { _id: 'up-2', type: 'image', name: 'new-b.jpg' },
      ],
    }),
  },
};

// Every mount shares the `asset-picker-list` async-data entry, so a panel left
// mounted would keep serving its own handler (and props) to the next test.
let mounted: { unmount: () => void }[] = [];
async function mountPanel(props: Record<string, unknown>) {
  const panel = await mountWithContext(AssetPickerPanel, {
    props: { open: true, ...props },
    global: { stubs },
  });
  mounted.push(panel);
  return panel;
}
afterEach(() => {
  for (const panel of mounted) panel.unmount();
  mounted = [];
  clearNuxtData('asset-picker-list');
});

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  assetApi.query.mockReset();
  assetApi.query.mockResolvedValue(batch([IMG, IMG2, PDF]));
  assetApi.byIds.mockReset();
  assetApi.byIds.mockResolvedValue([]);
});

describe('AssetPickerPanel', () => {
  it('fetches the library when opened', async () => {
    await mountPanel({});
    await flush();
    expect(assetApi.query).toHaveBeenCalled();
    const [state, scope] = lastQuery();
    expect(state).toMatchObject({ page: 1, pageSize: 24, sort: null });
    expect(state.filters).not.toHaveProperty('assetTypes');
    expect(scope).toBeUndefined();
  });

  it('confirms only the picked assets and disables Add until something new is picked', async () => {
    const panel = await mountPanel({});
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    expect(addButton.attributes('disabled')).toBeDefined();

    // Toggle the first card (AssetCard emits toggle-select from its checkbox).
    const firstCheckbox = panel.find('[data-slot="checkbox"]');
    await firstCheckbox.trigger('click');
    await flush();

    expect(addButton.attributes('disabled')).toBeUndefined();

    await addButton.trigger('click');
    await flush();
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]!._id).toBe('img-1');
  });

  it('single-select replaces the previous pick', async () => {
    const panel = await mountPanel({ multiple: false });
    await flush();

    const checkboxes = panel.findAll('[data-slot="checkbox"]');
    await checkboxes[0]!.trigger('click');
    await flush();
    await checkboxes[1]!.trigger('click');
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    await addButton.trigger('click');
    await flush();
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]!._id).toBe('img-2');
  });

  it('auto-selects uploaded assets matching the picker types', async () => {
    const panel = await mountPanel({ types: ['image'] });
    await flush();

    await panel.find('[data-test="emit-uploaded"]').trigger('click');
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    expect(addButton.attributes('disabled')).toBeUndefined();

    await addButton.trigger('click');
    await flush();
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed.map((a) => a._id)).toEqual(['up-1', 'up-2']);
  });

  it('single-select keeps only the first uploaded match', async () => {
    const panel = await mountPanel({ multiple: false, types: ['image'] });
    await flush();

    await panel.find('[data-test="emit-uploaded"]').trigger('click');
    await flush();

    const addButton = panel.find('[data-test="asset-picker-confirm"]');
    await addButton.trigger('click');
    await flush();
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed.map((a) => a._id)).toEqual(['up-1']);
  });

  it('sends the allowed types as a fixed filter', async () => {
    await mountPanel({ types: ['image'] });
    await flush();
    expect(lastQuery()[0].filters).toEqual({ assetTypes: ['image'] });
  });

  it('shows the plain empty state, not "no matches", when only types apply', async () => {
    assetApi.query.mockResolvedValue(batch([]));
    const panel = await mountPanel({ types: ['image'] });
    await flush();
    // i18n keys render raw in this suite.
    expect(panel.text()).toContain('empty_description');
    expect(panel.text()).not.toContain('empty_filtered_description');
  });

  it('flips to "Recently added" after an upload: all assets, newest first', async () => {
    const panel = await mountPanel({ folderId: 'f1' });
    await flush();
    expect(lastQuery()[1]).toEqual({ folderId: 'f1' });

    await panel.find('[data-test="emit-uploaded"]').trigger('click');
    await flush();
    const [state, scope] = lastQuery();
    expect(state.sort).toEqual({ field: 'createdAt', direction: 'desc' });
    expect(scope).toBeUndefined();
  });

  it('resolves selected ids that were never loaded before confirming', async () => {
    const LINKED = buildAsset({ _id: 'linked-1', name: 'old.jpg' });
    assetApi.byIds.mockResolvedValue([LINKED]);
    const panel = await mountPanel({ preselectedIds: ['linked-1'] });
    await flush();

    await panel.find('[data-slot="checkbox"]').trigger('click');
    await flush();
    await panel.find('[data-test="asset-picker-confirm"]').trigger('click');
    await flush();

    expect(assetApi.byIds).toHaveBeenCalledWith(['linked-1']);
    const confirmed = panel.emitted('confirm')![0]![0] as { _id: string }[];
    expect(confirmed.map((a) => a._id)).toEqual(['linked-1', 'img-1']);
  });

  it('stays open without confirming when the ids cannot be resolved', async () => {
    assetApi.byIds.mockRejectedValue(new Error('boom'));
    const panel = await mountPanel({ preselectedIds: ['linked-1'] });
    await flush();

    await panel.find('[data-slot="checkbox"]').trigger('click');
    await flush();
    await panel.find('[data-test="asset-picker-confirm"]').trigger('click');
    await flush();

    expect(panel.emitted('confirm')).toBeUndefined();
    expect(panel.emitted('update:open')).toBeUndefined();
  });
});
