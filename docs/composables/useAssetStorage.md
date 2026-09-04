# `useAssetStorage`

Provides the Assets Library storage figures — the header quota bar and the breakdown shown in [`AssetStoragePanel`](/components/asset/AssetStoragePanel.md).

:::tip PHASE 2
Storage totals come from the API in **phase 2**. This composable returns **mocked**, representative numbers today so the UI is complete; cutover is a pure data swap. See the Post-v0 milestone.
:::

## Usage

```ts
const { storage } = useAssetStorage();

// header summary
const usedPct = Math.round(
  (storage.value.usedBytes / storage.value.totalBytes) * 100,
);

// breakdown rows
storage.value.byType; // Images / Video / Documents / Other
storage.value.byFolder; // per top-level folder
```

## Returns

`storage: ComputedRef<AssetStorage>`:

| Field        | Type               | Meaning                            |
| ------------ | ------------------ | ---------------------------------- |
| `usedBytes`  | `number`           | Total bytes used.                  |
| `totalBytes` | `number`           | Quota.                             |
| `byType`     | `StorageSegment[]` | Usage grouped by broad asset type. |
| `byFolder`   | `StorageSegment[]` | Usage grouped by top-level folder. |

`StorageSegment` = `{ key, label, bytes, indicatorClass }` — `indicatorClass` is the Tailwind fill colour passed to the segment's `Progress` bar via its `indicator-class` prop.
