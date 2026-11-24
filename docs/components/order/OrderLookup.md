# `OrderLookup`

Finds orders by number and collects them in `v-model`. Media never checks that an order exists, so every `orderfile` link Studio writes takes its target from here: only an order the API returned can be picked.

## How it works

- The field is an `InputGroup` with **Find order** inside it at the end (an `InputGroupButton`, as in [`ProductMultiSelect`](/components/product/ProductMultiSelect)'s paste field), so the button never sits at a different height from the input. Enter finds too. While a lookup runs, the button shows a spinner and a second Find is ignored.
- The field takes one number or several, separated by commas, semicolons, spaces or new lines. A pasted column (e.g. from a spreadsheet) keeps its line breaks as separators. `parseOrderNumbers` (`#shared/utils/asset`) splits it, trims a leading `#`, drops leading zeros (the way media stores the id) and duplicates, and keeps tokens that aren't digits apart.
- **Find** looks up the numbers not already listed in one `orderApi.query` (`POST order/query` with an `orderIds` selection), with the global error toast suppressed. The orders found are added to the list in the order they were typed, and the field clears. A Find that only repeats listed numbers just clears the field.
- Each order renders as an [`OrderRow`](/components/order/OrderRow.md) with an X to remove it. An order in `linkedIds` gets a **Linked** badge; the caller decides not to link it again.
- An answer that lands after the component unmounted (the dialog or bulk pane closed) is dropped.

## Messages

| Case      | Renders                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not found | A calm dashed row: "No order with number 1224" (or "No orders with numbers 1224, 1225") + "Check the number and search again." Not red: it's an answer, not a failure. The orders found are still added. |
| Invalid   | Tokens that aren't digits, in the same row: "Not an order number: 12a4". No call is made for them.                                                                                                       |
| Error     | The query failed: a negative [`Feedback`](/components/Feedback) callout ("Failed to fetch orders") with **Retry**, and a log line. The numbers stay in the field, so Retry asks again.                   |

Typing in the field clears the message. The root has `min-w-0`: inside a dialog's grid, a row's truncated email would otherwise widen the whole dialog past its border. Its children don't shrink, so the list keeps its height in the bulk pane.

- The link target is `Order._id`, the legacy numeric id (not the public GUID).

## Usage

```vue
<script setup lang="ts">
const orders = ref<Order[]>([]);
</script>

<template>
  <OrderLookup v-model="orders" :linked-ids="linkedOrderIds" />
</template>
```

## Props

| Prop         | Type                      | Meaning                                                                                                        |
| ------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `modelValue` | `Order[]` (default `[]`)  | The orders found and kept, in the order they were added.                                                       |
| `linkedIds`  | `string[]` (default `[]`) | Orders the caller already links to: their rows get a **Linked** badge. The caller leaves them out of its call. |

## Where it's used

- [`AssetLinkOrderDialog`](/components/asset/AssetLinkOrderDialog.md) — link one asset from "Where it's used".
- The asset library's bulk **Link to order** action, as its properties pane.
