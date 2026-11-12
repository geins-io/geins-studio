# `QuotationCustomerDisplay`

`QuotationCustomerDisplay` is the read-only customer summary block on a quotation — company name + VAT, billing + shipping addresses, and buyer, in a 2-column grid with skeleton loading. The quotation owner isn't part of it: it shows in the Quotation details card.

## Features

- Three sections in a stacked 2-column grid — company / addresses / buyer
- Skeleton placeholders for every value when `loading` is `true`
- Renders `'-'` for missing values
- Routes addresses through [`ContentAddressDisplay`](/components/content/ContentAddressDisplay) with `address-only` so the company line isn't duplicated

## Usage

```vue
<template>
  <QuotationCustomerDisplay
    :company-name="quotation.company.name"
    :vat-number="quotation.company.vatNumber"
    :billing-address="quotation.billingAddress"
    :shipping-address="quotation.shippingAddress"
    :buyer-name="quotation.buyerName"
    :loading="loading"
  />
</template>
```

## Props

### `companyName`

```ts
companyName?: string
```

Company display name.

- **Default:** `''`

### `vatNumber`

```ts
vatNumber?: string
```

VAT number.

- **Default:** `''`

### `billingAddress` / `shippingAddress`

```ts
billingAddress?: Address | null
shippingAddress?: Address | null
```

Addresses rendered through [`ContentAddressDisplay`](/components/content/ContentAddressDisplay).

- **Default:** `null`

### `buyerName`

```ts
buyerName?: string
```

Buyer name already resolved to a display string — typically via `fullName(...)`.

- **Default:** `''`

### `loading`

```ts
loading?: boolean
```

Renders `Skeleton` placeholders in place of values.

- **Default:** `false`

## Dependencies

- shadcn-vue `Skeleton`
- [`ContentAddressDisplay`](/components/content/ContentAddressDisplay) — both address blocks
