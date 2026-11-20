# `AssetLinkOrderDialog`

Links one asset to an order, from the **Orders** group of [`AssetUsedIn`](/components/asset/AssetUsedIn.md). The merchant types the order number and [`OrderLookup`](/components/order/OrderLookup.md) finds it, so only an order the API returned can be linked. Any asset can be linked to an order, private ones included.

**Link to order** calls `assetApi.bulkLink([assetId], [orderLinkTarget(order._id)])` (`POST media/assets/bulk-link` with one `orderfile` target), toasts `entity_added` (`link`), closes and emits `linked` so the caller refetches. It stays disabled until an order is found, and for an order the asset already links to (the row reads **Linked**). Failures go to the global API error toast.

## Usage

```vue
<AssetLinkOrderDialog
  v-model:open="linkOrderOpen"
  :asset-id="assetId"
  :linked-order-ids="linkedOrderIds"
  @linked="refresh()"
/>
```

## Props

| Prop             | Type       | Meaning                               |
| ---------------- | ---------- | ------------------------------------- |
| `open`           | `boolean`  | `v-model:open`.                       |
| `assetId`        | `string`   | The asset to link.                    |
| `linkedOrderIds` | `string[]` | Order ids the asset already links to. |

## Events

| Event    | When                     |
| -------- | ------------------------ |
| `linked` | After a successful link. |
