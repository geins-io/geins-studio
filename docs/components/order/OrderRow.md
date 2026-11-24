# `OrderRow`

One order as a bordered row: **Order {number}**, then the date, the customer's email and the total, and the order's [`StatusBadge`](/components/StatusBadge.md). A trailing slot takes the row's actions (a remove button, an "Linked" badge).

When the order couldn't be looked up (`order` is `null`), the row shows the bare number. An `orderfile` link outlives its order and media never checks that one exists, so the link must still show.

## Usage

```vue
<OrderRow :order-id="link.targetId" :order="orders.get(link.targetId) ?? null">
  <Button variant="ghost" size="icon" @click="remove(link)">…</Button>
</OrderRow>
```

## Props

| Prop      | Type            | Meaning                                                           |
| --------- | --------------- | ----------------------------------------------------------------- |
| `orderId` | `string`        | The order's numeric id, as an `orderfile` link stores it.         |
| `order`   | `Order \| null` | The looked-up order. Omitted or `null` → only the number renders. |

## Slots

| Slot      | Purpose                      |
| --------- | ---------------------------- |
| `default` | Trailing actions or a badge. |

Used by [`OrderLookup`](/components/order/OrderLookup.md) (the orders found) and [`AssetUsedIn`](/components/asset/AssetUsedIn.md) (the asset's order links).
