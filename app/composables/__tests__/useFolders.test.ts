/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import type { Folder } from '#shared/types';
import { buildFolder } from '../../../test/fixtures';

mockNuxtImport('useGeinsRepository', () => () => ({
  assetApi: { folder: { list: vi.fn() } },
}));

// Derivations (tree, split, name lookup, descendants) are the logic under test,
// so stub useAsyncData with a ready dataset instead of exercising the fetch.
const folders: Folder[] = [
  buildFolder({ _id: 'f1', name: 'Marketing', parentId: null, sortOrder: 1 }),
  buildFolder({ _id: 'f2', name: 'Brand', parentId: 'f1', sortOrder: 2 }),
  buildFolder({ _id: 'f3', name: 'Ads', parentId: 'f1', sortOrder: 1 }),
  buildFolder({
    _id: 'sys1',
    name: 'Uncategorised',
    parentId: null,
    system: true,
  }),
];

mockNuxtImport('useAsyncData', () => () => ({
  data: ref(folders),
  pending: ref(false),
  error: ref(null),
  refresh: () => Promise.resolve(),
}));

import { useFolders } from '../useFolders';

describe('useFolders', () => {
  const { userFolders, systemFolders, tree, folderName, descendantIds } =
    useFolders();

  it('splits system vs user folders', () => {
    expect(userFolders.value.map((f) => f._id)).toEqual(['f1', 'f2', 'f3']);
    expect(systemFolders.value.map((f) => f._id)).toEqual(['sys1']);
  });

  it('builds a nested tree of user folders, sorted by sortOrder then name', () => {
    expect(tree.value).toHaveLength(1);
    const root = tree.value[0]!;
    expect(root._id).toBe('f1');
    // f3 (sortOrder 1) before f2 (sortOrder 2)
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
