# `AssetUsedIn`

The read-only **"Where it's used"** section of the [asset detail panel](/components/asset/AssetDetailPanel.md): what an asset is linked to outside the media library, read from `GET /media/assets/{id}/links`.

Product targets render as an [`AssetLinkedProduct`](/components/asset/AssetLinkedProduct.md) row (thumbnail + name + `articleNumber · id`); anything else renders a plain `targetType · targetId` row.

## What the API gives back

`media_response_assetLink` carries `assetId`, `targetType`, `targetId`, `createdBy?` and `createdAt` — **no display name**, and nothing on the server resolves the target. Two consequences shape this component:

- **The name is resolved client-side.** `targetId` goes through [`useProductMatch`](/composables/useProductMatch.md)'s `matchById`, which reads the products store. A product id has its leading zero stripped when the link is written (`033126` → `33126`), which `matchById` tolerates.
- **A link can outlive its target.** A link to a since-deleted product is still returned. It won't resolve to a name, so it falls through to the plain `targetType · targetId` row rather than disappearing — the link genuinely exists, and hiding it would misreport usage.

`targetType` is an **open string**. Only `product` can be written today, but the API documents that it returns values a given release doesn't name, so unknown types are rendered, never dropped.

## Props

| Prop      | Type     | Meaning                        |
| --------- | -------- | ------------------------------ |
| `assetId` | `string` | The asset whose links to list. |

## States

| State   | Renders                                                            |
| ------- | ------------------------------------------------------------------ |
| Pending | Two `Skeleton` rows.                                               |
| Error   | `Empty` with a destructive media icon and a retry button.          |
| Empty   | A muted line — the asset isn't used anywhere yet.                  |
| Links   | One row per link; products resolved, everything else as type + id. |

## Usage

Mounted by the detail panel below the info list:

```vue
<div class="mt-6 border-t pt-6">
  <AssetUsedIn :asset-id="asset._id" />
</div>
```

The read uses `useAsyncData` under the stable key `asset-links`, watched on `assetId` — one detail panel is open at a time, so a single cache entry is enough (the same shape as the panel's `asset-tags` read).

## Not included

Linking and unlinking (`POST` / `DELETE .../links`) are not wired — Studio has no product edit page to drive them from. The [replace dialog](/components/asset/AssetReplaceDialog.md)'s "used everywhere" warning is still static: replace has no phase-1 route (`canReplaceFile` is off), so there is nothing to feed it from yet.
