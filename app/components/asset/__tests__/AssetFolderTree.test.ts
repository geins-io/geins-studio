/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick, ref } from 'vue';
import { buildFolder } from '../../../../test/fixtures';
import { mountWithSidebar } from '../../../../test/helpers';
import type { FolderNode } from '@/composables/useFolders';

const { assetApi } = vi.hoisted(() => ({
  assetApi: {
    folder: { create: vi.fn(), listTrashed: vi.fn() },
  },
}));

const folderState = {
  tree: ref<FolderNode[]>([]),
  loading: ref(false),
  refresh: vi.fn(),
};

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));
mockNuxtImport('useFolders', () => () => ({
  ...folderState,
  folders: ref([]),
  error: ref(null),
  folderName: () => undefined,
  folderPath: () => [],
  descendantIds: () => [],
}));
mockNuxtImport('useBackgroundJobs', () => () => ({
  movingFolderIds: ref(new Set<string>()),
  start: vi.fn(),
  message: vi.fn(),
}));

import AssetFolderTree from '../AssetFolderTree.vue';

const MARKETING: FolderNode = {
  ...buildFolder({ _id: 'fld-mkt', name: 'Marketing' }),
  children: [],
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

let mounted: { unmount: () => void }[] = [];
async function mountTree() {
  const tree = await mountWithSidebar(AssetFolderTree);
  mounted.push(tree);
  return tree;
}
type Tree = Awaited<ReturnType<typeof mountTree>>;
const skeletons = (tree: Tree) =>
  tree.findAll('[data-sidebar="menu-skeleton"]');

beforeEach(() => {
  folderState.tree.value = [];
  folderState.loading.value = false;
  folderState.refresh.mockReset();
  folderState.refresh.mockResolvedValue(undefined);
  assetApi.folder.create.mockReset();
  assetApi.folder.create.mockResolvedValue({});
  assetApi.folder.listTrashed.mockReset();
  assetApi.folder.listTrashed.mockResolvedValue([]);
});
afterEach(() => {
  for (const tree of mounted) tree.unmount();
  mounted = [];
  clearNuxtData('asset-trash-folders');
});

describe('AssetFolderTree — loading', () => {
  it('shows skeletons on the first load only, and dims the tree on a refetch', async () => {
    folderState.loading.value = true;
    const tree = await mountTree();
    expect(skeletons(tree)).toHaveLength(4);

    folderState.tree.value = [MARKETING];
    folderState.loading.value = false;
    await nextTick();
    expect(skeletons(tree)).toHaveLength(0);

    folderState.loading.value = true;
    await nextTick();
    expect(skeletons(tree)).toHaveLength(0);
    expect(tree.text()).toContain('Marketing');
    expect(tree.find('[aria-busy="true"]').exists()).toBe(true);
  });

  it('keeps an empty library empty on a refetch', async () => {
    const tree = await mountTree();
    folderState.loading.value = true;
    await nextTick();
    expect(skeletons(tree)).toHaveLength(0);
  });
});

describe('AssetFolderTree — create', () => {
  it('keeps the new top-level row, spinning, until the refetch lands', async () => {
    const refetch = deferred();
    folderState.refresh.mockReturnValue(refetch.promise);
    const tree = await mountTree();

    await tree.find('[data-test="folder-tree-new"]').trigger('click');
    const input = tree.find('input');
    await input.setValue('Campaigns');
    await input.trigger('keydown.enter');
    await flush();

    expect(assetApi.folder.create).toHaveBeenCalledWith({
      name: 'Campaigns',
      parentFolderId: null,
    });
    expect(tree.find('input').attributes('readonly')).toBeDefined();
    expect(tree.find('input + .animate-spin').exists()).toBe(true);

    refetch.resolve();
    await flush();
    expect(tree.find('input').exists()).toBe(false);
  });

  it('keeps the new subfolder row, spinning, until the refetch lands', async () => {
    folderState.tree.value = [MARKETING];
    const refetch = deferred();
    folderState.refresh.mockReturnValue(refetch.promise);
    const tree = await mountTree();

    await tree.find('[data-test="folder-add-child"]').trigger('click');
    const input = tree.find('input');
    await input.setValue('Spring');
    await input.trigger('keydown.enter');
    await flush();

    expect(assetApi.folder.create).toHaveBeenCalledWith({
      name: 'Spring',
      parentFolderId: 'fld-mkt',
    });
    expect(tree.find('input').exists()).toBe(true);
    expect(tree.find('input').element.value).toBe('Spring');
    expect(tree.find('input').attributes('readonly')).toBeDefined();

    refetch.resolve();
    await flush();
    expect(tree.find('input').exists()).toBe(false);
  });

  it('drops the new row when the create fails', async () => {
    assetApi.folder.create.mockRejectedValue(new Error('409'));
    const tree = await mountTree();

    await tree.find('[data-test="folder-tree-new"]').trigger('click');
    const input = tree.find('input');
    await input.setValue('Campaigns');
    await input.trigger('keydown.enter');
    await flush();

    expect(folderState.refresh).not.toHaveBeenCalled();
    expect(tree.find('input').exists()).toBe(false);
  });
});
