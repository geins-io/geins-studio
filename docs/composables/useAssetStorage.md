# `useAssetStorage`

Provides the Assets Library storage figures from `GET media/usage`: the header quota bar and the breakdown shown in [`AssetStoragePanel`](/components/asset/AssetStoragePanel.md).

Every caller shares one `useAsyncData('asset-usage', …)` fetch, so the header and the panel stay in step, and a `refresh()` from either updates both.

## Usage

```ts
const { storage, pending, error, refresh } = useAssetStorage();

// header summary
storage.value?.usedBytes; // bytes used
storage.value?.totalBytes; // limit, or null when the account has none
storage.value?.usedPct; // 0–100, or null when there is no limit

// breakdown rows
storage.value?.byType; // Images / Video / Documents / Other
storage.value?.byFolder; // root folders + the files in no folder
```

## Returns

| Field     | Type                                | Meaning                                                    |
| --------- | ----------------------------------- | ---------------------------------------------------------- |
| `storage` | `ComputedRef<AssetStorage \| null>` | `null` until the first read lands, and after a failed one. |
| `pending` | `Ref<boolean>`                      | A read is in flight (also during a `refresh()` with data). |
| `error`   | `Ref<unknown>`                      | The last read failed. A `GET`, so no global toast fires.   |
| `refresh` | `() => Promise<void>`               | Re-reads usage. The panel calls it on every open.          |

`AssetStorage`:

| Field             | Type               | Meaning                                                                   |
| ----------------- | ------------------ | ------------------------------------------------------------------------- |
| `usedBytes`       | `number`           | `storage.bytes`: the latest reading in the range.                         |
| `totalBytes`      | `number \| null`   | `storage.limitBytes`; `null` for an account with no limit.                |
| `usedPct`         | `number \| null`   | Share of the limit used, capped at 100; `null` with no limit.             |
| `breakdownReadAt` | `string \| null`   | When the breakdown was last calculated; `null` = never, both lists empty. |
| `byType`          | `StorageSegment[]` | Usage by type group, largest first.                                       |
| `byFolder`        | `StorageSegment[]` | Usage by root folder, plus an "Uncategorised" row for the files in none.  |

`StorageSegment` = `{ key, label, bytes, pct, indicatorClass }`. `pct` is the share of `root.totalBytes` (the breakdown total), so each list adds up to ~100%. `indicatorClass` is the Tailwind fill colour passed to the segment's `Progress` via `indicator-class`: fixed per type group, by rank for folders (`bg-primary/80` down to `/30`).

## Mapping

The pure helpers live in `shared/utils/asset-usage.ts` (unit-tested):

- **Range**: `assetUsageRange()` is today and the six days before it, in UTC. A today-only range reads zero until the hourly job has read today; a week falls back to the latest reading. The breakdown ignores the range.
- **Types**: `groupUsageByType()` folds `image` + `svg` → Images, `video` → Video, `doc` + `pdf` → Documents, `audio` + `other` (and any type this release doesn't name) → Other. Empty groups are dropped.
- **Folders**: `usageFolderRows()` takes the root folders and adds `root.directBytes` as a row keyed `ROOT_FOLDER_KEY`, so the rows add up to `root.totalBytes`. Empty folders are dropped.
- **Limit**: `storageUsedPct()` returns `null` when `limitBytes` is `null`.
