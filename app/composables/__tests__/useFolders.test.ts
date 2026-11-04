// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { Folder } from '#shared/types';
import { buildFolder } from '../../../test/fixtures';

mockNuxtImport('useGeinsRepository', () => () => ({
  assetApi: { folder: { list: vi.fn() } },
}));

// Derivations (tree, name lookup, descendants) are the logic under test, so
// stub useAsyncData with a ready dataset instead of exercising the fetch.
const folders: Folder[] = [
  buildFolder({ _id: 'f1', name: 'Marketing', parentFolderId: null }),
  buildFolder({ _id: 'f2', name: 'Brand', parentFolderId: 'f1' }),
  buildFolder({ _id: 'f3', name: 'Ads', parentFolderId: 'f1' }),
];

const status = ref('success');
const refresh = vi.fn(() => Promise.resolve());

mockNuxtImport('useAsyncData', () => () => ({
  data: ref(folders),
  status,
  pending: ref(false),
  error: ref(null),
  refresh,
}));

import { useFolders } from '../useFolders';

describe('useFolders loading', () => {
  beforeEach(() => refresh.mockClear());

  it('loads on setup when nothing is loaded', () => {
    status.value = 'idle';
    useFolders();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('joins a load already in flight or done instead of refetching', () => {
    status.value = 'pending';
    useFolders();
    status.value = 'success';
    useFolders();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('retries a failed load', () => {
    status.value = 'error';
    useFolders();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('waits for load() when immediate is false', async () => {
    status.value = 'idle';
    const { load } = useFolders({ immediate: false });
    expect(refresh).not.toHaveBeenCalled();
    await load();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe('useFolders', () => {
  const { folders, tree, folderName, descendantIds } = useFolders();

  it('normalizes the fetched list', () => {
    expect(folders.value.map((f) => f._id)).toEqual(['f1', 'f2', 'f3']);
  });

  it('builds a nested tree, sorted by name', () => {
    expect(tree.value).toHaveLength(1);
    const root = tree.value[0]!;
    expect(root._id).toBe('f1');
    // Ads before Brand — phase 1 has no manual ordering, so name decides.
    expect(root.children.map((c) => c._id)).toEqual(['f3', 'f2']);
  });

  it('resolves a folder name by id, undefined for null/unknown', () => {
    expect(folderName('f2')).toBe('Brand');
    expect(folderName(null)).toBeUndefined();
    expect(folderName('nope')).toBeUndefined();
  });

  it('returns a folder plus its descendants', () => {
    expect([...descendantIds('f1')].sort()).toEqual(['f1', 'f2', 'f3']);
    expect(descendantIds('f2')).toEqual(['f2']);
  });
});
