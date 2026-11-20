# `OrderLookup`

Finds one order by its number and hands it back through `v-model`. Media never checks that an order exists, so every `orderfile` link Studio writes takes its target from here: only an order the API returned can be picked.

## How it works

- The merchant types the order number and presses **Find order** (or Enter). `parseOrderNumber` (`#shared/utils/asset`) accepts digits only, trims spaces and a leading `#`, and drops leading zeros, the way media stores the id. Anything else shows "An order number has digits only." without a call.
- **Find** calls `orderApi.get(id)` (`GET order/{id}`). A `404` (or `400`) reads "No order with number {number}."; any other failure reads "Couldn't look up the order. Try again." and logs. A read never raises the global API error toast.
- The found order renders as an [`OrderRow`](/components/order/OrderRow.md) and becomes the model. Typing again clears the model, so a stale order can't be linked.
- The link target is the returned `Order._id`, the legacy numeric id (not the public GUID).

## Usage

```vue
<script setup lang="ts">
const order = ref<Order | null>(null);
</script>

<template>
  <OrderLookup v-model="order" :linked-ids="linkedOrderIds" />
</template>
```

## Props

| Prop         | Type                      | Meaning                                                                                                        |
| ------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `modelValue` | `Order \| null`           | The found order, or `null`.                                                                                    |
| `linkedIds`  | `string[]` (default `[]`) | Orders the caller already links to: the found row gets a **Linked** badge. The caller disables its own action. |

## Where it's used

- [`AssetLinkOrderDialog`](/components/asset/AssetLinkOrderDialog.md) — link one asset from "Where it's used".
- The asset library's bulk **Link to order** action, as its properties pane.
- [`AssetWizardOrderLinking`](/components/asset/AssetWizardOrderLinking.md) — link every file of an upload.
