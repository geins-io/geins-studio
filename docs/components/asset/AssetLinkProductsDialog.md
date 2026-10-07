# `AssetLinkProductsDialog`

Links one asset to one or more products. Opened from the **Link to product** action in [`AssetUsedIn`](/components/asset/AssetUsedIn.md) ("Where it's used" in the asset detail panel).

- **Link as.** A segmented control: **Image** (`productimage`) or **File** (`productfile`). Only image and svg assets get the choice (`productLinkTargetType(assetType) === 'productimage'`), defaulting to Image. Every other type links as File and the control is hidden — a `productimage` link on a non-image is a `422`, so the UI never offers it.
- **Products.** A [`ProductMultiSelect`](/components/product/ProductMultiSelect.md) over the products store. Products already linked **as the chosen kind** are checked and disabled ("Linked"); switching kind drops any pick that would duplicate an existing link.
- **Link.** One `assetApi.bulkLink([assetId], links)` (`POST /media/assets/bulk-link`) per 100 products (`chunkIds`). Linking only adds, so a partially failed run is safe to repeat. On success it toasts `entity_added` (`entityKey: 'link'`, pluralized by count), closes and emits `linked`; a failure leaves the dialog open (the global API error toast explains) and still emits `linked` so the caller's list shows what did land.

## Props

| Prop               | Type                                    | Meaning                                       |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| `assetId`          | `string`                                | The asset to link.                            |
| `assetType`        | `AssetType`                             | Decides whether **Image** is offered.         |
| `linkedProductIds` | `Record<AssetLinkTargetType, string[]>` | Product ids already linked, per link kind.    |
| `open` (`v-model`) | `boolean`                               | Dialog visibility; picks reset on every open. |

## Events

| Event    | Payload | When                                                   |
| -------- | ------- | ------------------------------------------------------ |
| `linked` | —       | After a link run (success or failure) — refetch links. |

## Usage

```vue
<AssetLinkProductsDialog
  v-model:open="linkOpen"
  :asset-id="assetId"
  :asset-type="assetType"
  :linked-product-ids="linkedProductIds"
  @linked="refresh()"
/>
```
