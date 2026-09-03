// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  toAsset,
  toFolder,
  assetColumns,
  folderColumns,
  descendantFolderIds,
  distinctSortedTags,
  folderPathIndex,
  assetFolderPath,
  resolveAssetFolderFilter,
  UNCATEGORISED_FOLDER_ID,
} from '../assets-mock';

// Minimal row shapes matching the Supabase mock columns.
const assetRow = {
  id: 'a1',
  name: 'hero.jpg',
  type: 'image' as const,
  folder_id: 'f1',
  description: null,
  localizations: { en: { altText: 'Hero' }, sv: { altText: 'Hjälte' } },
  tags: ['campaign'],
  channels: ['web'],
  size_bytes: 1234,
  mime: 'image/jpeg',
  url: 'https://cdn/hero.jpg',
  thumb_url: 'https://cdn/hero-t.jpg',
  created_by: 'olivia',
  created_at: '2026-08-17T00:00:00.000Z',
  updated_at: '2026-08-18T00:00:00.000Z',
};

const folderRow = {
  id: 'f1',
  name: 'Marketing',
  parent_id: null,
  system: false,
  sort_order: 2,
  created_at: '2026-08-17T00:00:00.000Z',
};

describe('toAsset', () => {
  it('maps snake_case columns to the camelCase contract', () => {
    const asset = toAsset(assetRow);
    expect(asset).toMatchObject({
      _id: 'a1',
      _type: 'geins.asset',
      folderId: 'f1',
      sizeBytes: 1234,
      thumbUrl: 'https://cdn/hero-t.jpg',
      createdBy: 'olivia',
      createdAt: '2026-08-17T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z',
    });
  });

  it('builds path from folderPath + name; null folderPath = root', () => {
    expect(toAsset(assetRow, 'marketing/campaigns')).toMatchObject({
      folderPath: 'marketing/campaigns',
      path: 'marketing/campaigns/hero.jpg',
    });
    const root = toAsset(assetRow);
    expect(root.folderPath).toBeNull();
    expect(root.path).toBe('hero.jpg');
  });

  it('derives default-language altText from localizations', () => {
    expect(toAsset(assetRow).altText).toBe('Hero');
  });

  it('defaults nullable collections + altText when absent', () => {
    const asset = toAsset({
      ...assetRow,
      localizations: null,
      tags: null,
      channels: null,
    });
    expect(asset.altText).toBeNull();
    expect(asset.tags).toEqual([]);
    expect(asset.channels).toEqual([]);
    expect(asset.localizations).toEqual({});
  });
});

describe('toFolder', () => {
  it('maps folder columns to the contract (defaults to a top-level path)', () => {
    expect(toFolder(folderRow)).toEqual({
      _id: 'f1',
      _type: 'folder',
      name: 'Marketing',
      parentId: null,
      system: false,
      sortOrder: 2,
      fullPath: 'Marketing',
      depth: 1,
      createdAt: '2026-08-17T00:00:00.000Z',
    });
  });

  it('takes fullPath + depth from the supplied path meta', () => {
    const folder = toFolder(folderRow, { fullPath: 'a/b/Marketing', depth: 3 });
    expect(folder.fullPath).toBe('a/b/Marketing');
    expect(folder.depth).toBe(3);
  });
});

describe('assetColumns', () => {
  it('only maps provided keys (partial PATCH)', () => {
    expect(assetColumns({ name: 'x', folderId: 'f2' })).toEqual({
      name: 'x',
      folder_id: 'f2',
    });
  });

  it('is empty for an empty body', () => {
    expect(assetColumns({})).toEqual({});
  });
});

describe('folderColumns', () => {
  it('maps provided keys only', () => {
    expect(folderColumns({ name: 'A', parentId: 'p', sortOrder: 3 })).toEqual({
      name: 'A',
      parent_id: 'p',
      sort_order: 3,
    });
  });
});

describe('resolveAssetFolderFilter', () => {
  it('returns "none" when no folder is selected', () => {
    expect(resolveAssetFolderFilter(undefined)).toBe('none');
  });

  it('maps the Uncategorised system folder to a NULL-folder filter', () => {
    // Regression: Uncategorised owns no rows — assets re-homed by folder delete
    // land at folder_id IS NULL, so matching its id returned an empty view.
    expect(resolveAssetFolderFilter(UNCATEGORISED_FOLDER_ID)).toBe('null');
  });

  it('resolves any other folder to a subtree filter', () => {
    expect(
      resolveAssetFolderFilter('10000000-0000-0000-0000-000000000001'),
    ).toBe('descendants');
  });
});

describe('distinctSortedTags', () => {
  it('collects a distinct, sorted tag set across rows', () => {
    expect(
      distinctSortedTags([
        { tags: ['social', 'sale'] },
        { tags: ['sale', 'brand'] },
        { tags: null },
      ]),
    ).toEqual(['brand', 'sale', 'social']);
  });

  it('trims blanks and drops empty tags', () => {
    expect(distinctSortedTags([{ tags: ['  hero  ', '', '   '] }])).toEqual([
      'hero',
    ]);
  });

  it('is empty for no rows', () => {
    expect(distinctSortedTags([])).toEqual([]);
  });
});

describe('folderPathIndex', () => {
  // marketing ┬ campaigns
  //           └ social
  // brand (top-level)
  const folders = [
    { id: 'm', parent_id: null, name: 'marketing' },
    { id: 'c', parent_id: 'm', name: 'campaigns' },
    { id: 's', parent_id: 'm', name: 'social' },
    { id: 'b', parent_id: null, name: 'brand' },
  ];

  it('builds full paths + depth by walking the parent chain', () => {
    const idx = folderPathIndex(folders);
    expect(idx.get('m')).toEqual({ fullPath: 'marketing', depth: 1 });
    expect(idx.get('c')).toEqual({
      fullPath: 'marketing/campaigns',
      depth: 2,
    });
    expect(idx.get('b')).toEqual({ fullPath: 'brand', depth: 1 });
  });

  it('assetFolderPath resolves a folder id, null at the root', () => {
    const idx = folderPathIndex(folders);
    expect(assetFolderPath(idx, 'c')).toBe('marketing/campaigns');
    expect(assetFolderPath(idx, null)).toBeNull();
    expect(assetFolderPath(idx, 'missing')).toBeNull();
  });
});

describe('descendantFolderIds', () => {
  // f1 ┬ f2 ┬ f4
  //    │    └ f5
  //    └ f3
  // f6 (unrelated)
  const folders = [
    { id: 'f1', parent_id: null },
    { id: 'f2', parent_id: 'f1' },
    { id: 'f3', parent_id: 'f1' },
    { id: 'f4', parent_id: 'f2' },
    { id: 'f5', parent_id: 'f2' },
    { id: 'f6', parent_id: null },
  ];

  it('returns the folder plus its whole subtree', () => {
    expect([...descendantFolderIds(folders, 'f1')].sort()).toEqual([
      'f1',
      'f2',
      'f3',
      'f4',
      'f5',
    ]);
  });

  it('returns a subtree from a nested node', () => {
    expect([...descendantFolderIds(folders, 'f2')].sort()).toEqual([
      'f2',
      'f4',
      'f5',
    ]);
  });

  it('returns just the id for a leaf', () => {
    expect(descendantFolderIds(folders, 'f6')).toEqual(['f6']);
  });
});
