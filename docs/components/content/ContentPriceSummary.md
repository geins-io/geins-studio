# `ContentPriceSummary`

A detailed order/quotation price breakdown table with optional inline edit popovers for discount and shipping fee.

## Features

- Renders subtotal, discount, shipping, total (ex VAT), VAT, and grand total rows
- Rows hidden when their value is 0 and `editMode` is `false`
- `editMode` shows popover triggers for discount and shipping: discount supports `percent` or `fixedAmount` mode
- Three two-way models: `discountType`, `discountValue`, `shippingFee`
- `blur` event emitted after the user commits a discount or shipping change
- Currency formatting via `usePrice().formatCurrency`

## Usage

### Read-only display

```vue
<script setup lang="ts">
import type { QuotationTotal } from '#shared/types'

const total: QuotationTotal = { subtotal: 1000, discount: 0, shipping: 0, grandTotalExVat: 1000, vat: 250, grandTotalIncVat: 1250 }
</script>

<template>
  <ContentPriceSummary :total="total" currency="SEK" />
</template>
```

### Edit mode

```vue
<script setup lang="ts">
const discountType = ref<'percent' | 'fixedAmount'>('percent')
const discountValue = ref('')
const shippingFee = ref('')
</script>

<template>
  <ContentPriceSummary
    :total="total"
    currency="SEK"
    :edit-mode="true"
    v-model:discount-type="discountType"
    v-model:discount-value="discountValue"
    v-model:shipping-fee="shippingFee"
    @blur="recalculate"
  />
</template>
```

## Props

### `total`

```ts
total: QuotationTotal
```

- **Type:** `QuotationTotal`
- **Required:** yes
- **Description:** Price totals object. Must include `subtotal`, `discount`, `grandTotalExVat`, `vat`, `grandTotalIncVat`.

### `currency`

```ts
currency: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** ISO currency code shown next to each formatted value (e.g. `'SEK'`, `'EUR'`).

### `label`

```ts
label?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Optional section label (currently unused in the template but available for future use).

### `editMode`

```ts
editMode?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enables popover edit triggers on the discount and shipping rows.

## Models

### `discountType`

```ts
v-model:discountType="value"  // 'percent' | 'fixedAmount'
```

- **Default:** `'percent'`

### `discountValue`

```ts
v-model:discountValue="value"  // string
```

- **Default:** `''`

### `shippingFee`

```ts
v-model:shippingFee="value"  // string
```

- **Default:** `''`

## Events

### `blur`

```ts
(e: 'blur'): void
```

Emitted when the user exits the discount or shipping input. Use to trigger a price recalculation.

## Type Definitions

```ts
interface QuotationTotal {
  subtotal: number
  discount: number
  shipping?: number
  suggestedShippingFee?: number
  grandTotalExVat: number
  vat: number
  grandTotalIncVat: number
}
```

## Dependencies

- `usePrice` — `formatCurrency`
- shadcn-vue [`Popover`](/components/shadcn-vue), [`DropdownMenu`](/components/shadcn-vue), [`Input`](/components/shadcn-vue)
