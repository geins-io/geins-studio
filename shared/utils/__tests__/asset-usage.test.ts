// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ROOT_FOLDER_KEY } from '../asset';
import {
  assetUsageRange,
  groupUsageByType,
  storageUsedPct,
  usageFolderRows,
  usageShare,
} from '../asset-usage';

describe('assetUsageRange', () => {
  it('spans today and the six days before it, in UTC', () => {
    // 00:30 on the 14th in UTC+2 is still the 13th in UTC.
    const now = new Date('2026-10-13T22:30:00Z');
    expect(assetUsageRange(now)).toEqual({
      from: '2026-10-07',
      to: '2026-10-13',
    });
  });

  it('crosses a month boundary', () => {
    expect(assetUsageRange(new Date('2026-03-03T08:00:00Z'))).toEqual({
      from: '2026-02-25',
      to: '2026-03-03',
    });
  });
});

describe('storageUsedPct', () => {
  it('is null for an account with no limit', () => {
    expect(storageUsedPct({ bytes: 5_000, limitBytes: null })).toBeNull();
  });

  it('is the rounded share of the limit', () => {
    expect(storageUsedPct({ bytes: 2_150, limitBytes: 10_000 })).toBe(22);
  });

  it('caps at 100 for an account over its limit', () => {
    expect(storageUsedPct({ bytes: 12_000, limitBytes: 10_000 })).toBe(100);
  });

  it('handles a zero limit without dividing by zero', () => {
    expect(storageUsedPct({ bytes: 0, limitBytes: 0 })).toBe(0);
    expect(storageUsedPct({ bytes: 1, limitBytes: 0 })).toBe(100);
  });
});

describe('usageShare', () => {
  it('rounds to a whole percent and is 0 without a total', () => {
    expect(usageShare(1, 3)).toBe(33);
    expect(usageShare(5, 0)).toBe(0);
  });
});

describe('groupUsageByType', () => {
  it('folds the seven API types into four groups, largest first', () => {
    expect(
      groupUsageByType([
        { type: 'image', bytes: 100 },
        { type: 'video', bytes: 300 },
        { type: 'svg', bytes: 50 },
        { type: 'pdf', bytes: 40 },
        { type: 'doc', bytes: 20 },
        { type: 'audio', bytes: 7 },
        { type: 'other', bytes: 3 },
      ]),
    ).toEqual([
      { group: 'video', bytes: 300 },
      { group: 'images', bytes: 150 },
      { group: 'documents', bytes: 60 },
      { group: 'other', bytes: 10 },
    ]);
  });

  it('counts a type this release does not name as other', () => {
    expect(groupUsageByType([{ type: 'model3d', bytes: 9 }])).toEqual([
      { group: 'other', bytes: 9 },
    ]);
  });

  it('leaves out empty groups', () => {
    expect(
      groupUsageByType([
        { type: 'image', bytes: 10 },
        { type: 'video', bytes: 0 },
      ]),
    ).toEqual([{ group: 'images', bytes: 10 }]);
    expect(groupUsageByType([])).toEqual([]);
  });
});

describe('usageFolderRows', () => {
  const folders = [
    { _id: 'f1', name: 'Products', bytes: 1_750 },
    { _id: 'f2', name: 'Campaigns', bytes: 320 },
    { _id: 'f3', name: 'Empty', bytes: 0 },
  ];

  it('adds the files in no folder as a row, sorted with the folders', () => {
    expect(
      usageFolderRows({
        folders,
        root: { directBytes: 500, totalBytes: 2_570 },
      }),
    ).toEqual([
      { key: 'f1', name: 'Products', bytes: 1_750 },
      { key: ROOT_FOLDER_KEY, name: null, bytes: 500 },
      { key: 'f2', name: 'Campaigns', bytes: 320 },
    ]);
  });

  it('skips the root row when nothing sits in the root', () => {
    expect(
      usageFolderRows({ folders, root: { directBytes: 0, totalBytes: 2_070 } }),
    ).toEqual([
      { key: 'f1', name: 'Products', bytes: 1_750 },
      { key: 'f2', name: 'Campaigns', bytes: 320 },
    ]);
  });

  it('is empty before the first calculation', () => {
    expect(usageFolderRows({ folders: [], root: null })).toEqual([]);
  });
});
