# `AssetStoragePanel`

A read-only slide-in (`Sheet`) showing Assets Library storage usage: the total quota plus a breakdown by **asset type** or by **folder**, each row a labelled `Progress` bar. Opened from the storage summary in the library header.

Data comes from [`useAssetStorage`](/composables/useAssetStorage) (mocked; phase-2 API).

## Usage

```vue
<AssetStoragePanel v-model:open="storageOpen" />
```

Bind `open` (v-model) — the panel owns its `Tabs` switch and Close button internally.

## Props

| Prop   | Type      | Description                               |
| ------ | --------- | ----------------------------------------- |
| `open` | `boolean` | v-model. Controls the sheet's visibility. |

## Notes

- Segment percentages are of the **used** total (matching the prototype), not the quota.
- The "Folder" tab reuses the shared `folder` label; segment colours come from each `StorageSegment.indicatorClass`, passed to `Progress` via `indicator-class`.
