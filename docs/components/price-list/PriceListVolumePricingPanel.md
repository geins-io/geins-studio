# `PriceListVolumePricingPanel`

`PriceListVolumePricingPanel` is the sheet for editing volume pricing on a single product within a price list — shows global rules as read-only context above the product's own editable rules, with live preview-price calls per change.

## Features

- Two stacked rule tables:
  - **Global** (`disabled`) — rules inherited from the price list, read-only
  - **Product** — editable rules for this product
- Live price-preview calls: every per-row change debounces a call to `productApi.priceList.id(...).previewPrice(...)` and writes the calculated `margin`, `discountPercent`, `price` back into the row
- Save flow: validates each rule (quantity > 1, at least one numeric value) and converts to `PriceListProduct[]` via [`usePriceListProducts`](/composables/usePriceListProducts) — surfaces a [`Feedback`](/components/feedback/Feedback) banner when invalid
- Cancel discards local changes; Save commits via the `save` event
- Two-way `v-model:open` and `v-model:priceListProducts` so the parent's selected-products state stays in sync

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const priceListProducts = ref<PriceListProduct[]>([]);

const onSave = (products: PriceListProduct[]) => {
  priceListProducts.value = products;
};
</script>

<template>
  <PriceListVolumePricingPanel
    v-model:open="open"
    v-model:price-list-products="priceListProducts"
    :rules="productRules"
    :product-id="productId"
    :product-name="productName"
    :price-list-id="priceListId"
    :currency="currency"
    :vat-description="vatDescription"
    @save="onSave"
  />
</template>
```

## Props

### `rules`

```ts
rules: PriceListRule[]
```

Combined rules for this product — the panel splits into `global` (read-only) and `editable` internally.

### `productId`

```ts
productId: string
```

Product `_id`.

### `productName`

```ts
productName: string
```

Used in the sheet description.

### `priceListId`

```ts
priceListId: string
```

Used to scope the preview-price API call.

### `currency`

```ts
currency?: string
```

Forwarded to [`PriceListRules`](/components/price-list/PriceListRules) for the price column.

### `vatDescription`

```ts
vatDescription?: string
```

Localized VAT descriptor (e.g. `"ex VAT"`).

## v-model

### `open`

```ts
v-model:open: boolean
```

Sheet visibility.

### `priceListProducts`

```ts
v-model:priceListProducts: PriceListProduct[]
```

Two-way binding of the parent's selected products array. The panel rewrites this on Save.

- **Default:** `[]`

## Events

### `save`

```ts
(rules: PriceListProduct[]): void
```

Emitted on Save with the merged products list. Parent typically forwards it to the API.

## Slots

### default

The `SheetTrigger` content (typically a button).

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`PriceListRules`](/components/price-list/PriceListRules) (in `all` mode)
- [`ContentCardHeader`](/components/content/ContentCardHeader), [`Feedback`](/components/feedback/Feedback)
- [`usePriceListProducts`](/composables/usePriceListProducts) — `getPriceListProduct`, `getNewPriceListProducts`
- [`useGeinsRepository`](/composables/useGeinsRepository) — `productApi.priceList.previewPrice`
