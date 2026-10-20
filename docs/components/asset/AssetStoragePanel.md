# `AssetStoragePanel`

A read-only slide-in (`Sheet`) showing Assets Library storage usage: storage used (against the limit, when the account has one) plus a breakdown by **asset type** or by **folder**, each row a labelled `Progress` bar. Opened from the storage summary in the library header.

Data comes from [`useAssetStorage`](/composables/useAssetStorage) (`GET media/usage`).

## Usage

```vue
<AssetStoragePanel v-model:open="storageOpen" />
```

Bind `open` (v-model). The panel owns its `Tabs` switch and Close button internally.

## Props

| Prop   | Type      | Description                               |
| ------ | --------- | ----------------------------------------- |
| `open` | `boolean` | v-model. Controls the sheet's visibility. |

## States

- **Loading** (first read): skeleton in place of the total.
- **Error** (no data): `Empty` with `variant="destructive"` and a **Retry** button. No toast, since the read is a `GET`.
- **No limit** (`totalBytes === null`): "X used", with no progress bar.
- **No breakdown yet** (`breakdownReadAt === null`): an `Empty` state in place of the rows. The breakdown is calculated with each storage reading, so this clears within the hour.
- **Empty library**: an `Empty` "No assets" state.

## Notes

- Re-reads usage on **every open**, so a panel opened after an upload or delete shows the latest reading.
- Segment percentages are of the **breakdown total** (`root.totalBytes`), so each tab adds up to ~100%. The breakdown is the live assets' summed size, a little less than the storage total (which also counts Azure's per-file overhead), so the two figures don't match exactly.
- The Folders tab adds an "Uncategorised" row for the files in no folder when there are any.
- "Updated {time}" under the rows is `breakdownReadAt` as a relative time (`useDate().formatRelativeDate`).
- The Folders tab reuses the shared `folder` label. Segment colours come from each `StorageSegment.indicatorClass`.
