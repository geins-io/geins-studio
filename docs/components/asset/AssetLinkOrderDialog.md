# `AssetLinkOrderDialog`

Links one asset to one or more orders, from the **Orders** group of [`AssetUsedIn`](/components/asset/AssetUsedIn.md). The merchant types the order numbers and [`OrderLookup`](/components/order/OrderLookup.md) lists the orders it finds, so only orders the API returned can be linked. Any asset can be linked to an order, private ones included.

**Link to N orders** calls `assetApi.bulkLink([assetId], orderIds.map(orderLinkTarget))` (`POST media/assets/bulk-link`) per 100 orders (`chunkIds`, a call takes at most 100 links), toasts `entity_added` (`link`), closes and emits `linked` so the caller refetches. Orders the asset already links to stay in the list with a **Linked** badge but aren't counted or sent; the button stays disabled until at least one new order is listed. Failures go to the global API error toast; the dialog stays open and still emits `linked`, so a partial run shows what landed (linking only adds, so it's safe to repeat).

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

| Event    | When                                                           |
| -------- | -------------------------------------------------------------- |
| `linked` | After a link call, successful or not, so the caller refetches. |
