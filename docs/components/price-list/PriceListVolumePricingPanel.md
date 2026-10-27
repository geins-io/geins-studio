# `PriceListVolumePricingPanel`

`PriceListVolumePricingPanel` is the sheet for editing volume pricing on a single product within a price list — shows global rules as read-only context above the product's own editable rules, with live preview-price calls per change.

## Features

- Two stacked rule tables:
  - **Global** (`disabled`) — rules inherited from the price list, read-only
  - **Product** — editable rules for this product
- Live price-preview calls: every per-row change debounces a call to `productApi.priceList.id(...).previewPrice(...)` and writes the calculated `margin`, `discountPercent`, `price` back into the row
- Save flow: validates each rule (quantity > 1, at least one numeric value) and converts to `PriceListProduct[]` via [`usePriceListProducts`](/composables/usePriceListProducts) — surfaces a [`Feedback`](/components/Feedback) banner when invalid
- Cancel discards local changes; Save commits via the `save` event
- Two-way `v-model:open` and `v-model:priceListProducts` so the parent's selected-products state stays in sync
- **Read-only mode** (`readonly`) for prices that can't be edited (the company page's ERP company set prices): a price / list price / margin header for the product, a plain table of its price breaks (quantity `10+`, price, discount, margin), no global section, no inputs, Close-only footer

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

### Read-only

```vue
<template>
  <PriceListVolumePricingPanel
    v-model:open="open"
    readonly
    :rules="product?.volumePricing ?? []"
    :product="product"
    :product-id="product?._id ?? ''"
    :product-name="product?.name ?? ''"
    :price-list-id="priceList._id"
    :currency="priceList.currency"
    :vat-description="vatDescription"
    :list-price-title="$t('pricing.company_price')"
  />
</template>
```

`product` is a `PriceListProductList` row from `transformProductsForList`, so the tiers come from the grid's data — no extra fetch.

## Props

### `rules`

```ts
rules: PriceListRule[]
```

Combined rules for this product — the panel splits into `global` (read-only) and `editable` internally.

### `productId`

```ts
productId: string;
```

Product `_id`.

### `productName`

```ts
productName: string;
```

Used in the sheet description.

### `priceListId`

```ts
priceListId: string;
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

### `readonly`

```ts
readonly?: boolean
```

View-only mode: the product's price breaks (all of `rules`, including global ones) in a plain table, no inputs, no global section, Close-only footer. The editable mode is unchanged.

### `product`

```ts
product?: PriceListProductList
```

Read-only mode only: supplies the header values (`regularPrice`, `listPrice`, `margin`).

### `listPriceTitle`

```ts
listPriceTitle?: string
```

Read-only mode only: label for `listPrice` in the header, suffixed with `vatDescription`. Defaults to "Price list price".

### `description`

```ts
description?: string
```

Read-only mode only: description under the product's price breaks heading. Defaults to the company wording ("…for this company"); the price list page passes its own.

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
- [`ContentCardHeader`](/components/content/ContentCardHeader), [`Feedback`](/components/Feedback)
- [`usePriceListProducts`](/composables/usePriceListProducts) — `getPriceListProduct`, `getNewPriceListProducts`
- [`useGeinsRepository`](/composables/useGeinsRepository) — `productApi.priceList.previewPrice`
