# `AssetUsedIn`

The **"Where it's used"** section of the [asset detail panel](/components/asset/AssetDetailPanel.md): what an asset is linked to outside the media library, read from `GET /media/assets/{id}/links`, plus linking the asset to a product and removing a product link.

Product targets — both `productimage` and `productfile` — render as an [`AssetLinkedProduct`](/components/asset/AssetLinkedProduct.md) row (thumbnail + name + `articleNumber · id`) with an **Image** / **File** kind badge; an unresolved product link renders `Product · targetId` with the same badge, and any other target type a plain `targetType · targetId` row.

## What the API gives back

`media_response_assetLink` carries `assetId`, `targetType`, `targetId`, `createdBy?` and `createdAt` — **no display name**, and nothing on the server resolves the target. Two consequences shape this component:

- **The name is resolved client-side.** `targetId` goes through [`useProductMatch`](/composables/useProductMatch.md)'s `matchById`, which reads the products store. A product id has its leading zero stripped when the link is written (`033126` → `33126`), which `matchById` tolerates.
- **A link can outlive its target.** A link to a since-deleted product is still returned. It won't resolve to a name, so it falls through to the plain `targetType · targetId` row rather than disappearing — the link genuinely exists, and hiding it would misreport usage.

`targetType` is read as an **open string**. The writable kinds are `productimage` (image + svg only) and `productfile` (any type) — `isProductLink` recognises both — but the API documents that it returns values a given release doesn't name, so unknown types are rendered, never dropped.

A **trashed** asset's links answer `404`. The detail panel never opens for a trashed asset, but the fetcher still maps a `404` to an empty list, so it reads as "not used anywhere" rather than the error state (a `GET` never raises the global toast).

## Props

| Prop        | Type        | Meaning                                                     |
| ----------- | ----------- | ----------------------------------------------------------- |
| `assetId`   | `string`    | The asset whose links to list.                              |
| `assetType` | `AssetType` | Decides which link kinds are offered (see "Linking" below). |

## States

| State   | Renders                                                          |
| ------- | ---------------------------------------------------------------- |
| Pending | Two `Skeleton` rows.                                             |
| Error   | `Empty` with a destructive media icon and a retry button.        |
| Loaded  | The Products group (rows or "No products"), plus Other when any. |

## Usage

Mounted by the detail panel below the info list:

```vue
<div class="mt-6 border-t pt-6">
  <AssetUsedIn :asset-id="asset._id" :asset-type="asset.type" />
</div>
```

The read uses `useAsyncData` under the stable key `asset-links`, watched on `assetId` — one detail panel is open at a time, so a single cache entry is enough (the same shape as the panel's `asset-tags` read).

## Grouping

Links are split into two groups:

- **Products** — every `productimage` / `productfile` link. Always shown, with the **Link to product** action and a "No products" line when empty.
- **Other** — any other target type, as read-only `targetType · targetId` rows. Only shown when there is one.

Assets will be used by more than products (CMS, channel storefront settings, mail settings, …). Those uses aren't linked from the asset — each is created where the asset is used — so the asset panel only links to **products**. When the API returns those targets, the **Other** group is where they become a list of Studio entities (resolved names, links to the entity), next to the product group rather than mixed into it.

## Linking and removing

- **Link to product** opens [`AssetLinkProductsDialog`](/components/asset/AssetLinkProductsDialog.md): a **Link as** choice (Image or File) and a multi-select product search. It links one asset to any number of products in one go.
- The section passes the dialog the product ids already linked per kind (`linkedProductIds`), which the picker shows checked and disabled ("Linked").
- Every product row has a remove button (tooltip "Remove link") that confirms through [`DialogDelete`](/components/dialog/DialogDelete.md) and calls `assetApi.removeLink(id, targetType, targetId)` (`DELETE /media/assets/{id}/links/{targetType}/{targetId}`), with the stored `targetId` as returned (leading zero already stripped). Other target types aren't removable here.
- After a link or remove, `asset-links` is refetched (link routes need no `If-Match`). Success toasts use `entity_added` / `entity_removed` with `entityKey: 'link'`; failures go to the global API error toast.

## Related

The [replace dialog](/components/asset/AssetReplaceDialog.md) reads the same endpoint to count these links in its "used everywhere" warning.
