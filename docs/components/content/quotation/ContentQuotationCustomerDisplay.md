# `ContentQuotationCustomerDisplay`

`ContentQuotationCustomerDisplay` is the read-only customer summary block on a quotation — company name + VAT, billing + shipping addresses, buyer + owner, and currency, all in a 2-column grid with skeleton loading.

## Features

- Five sections in a stacked 2-column grid — company / addresses / owner+buyer / currency
- Skeleton placeholders for every value when `loading` is `true`
- Renders `'-'` for missing values
- Routes addresses through [`ContentAddressDisplay`](/components/content/ContentAddressDisplay) with `address-only` so the company line isn't duplicated

## Usage

```vue
<template>
  <ContentQuotationCustomerDisplay
    :company-name="quotation.company.name"
    :vat-number="quotation.company.vatNumber"
    :billing-address="quotation.billingAddress"
    :shipping-address="quotation.shippingAddress"
    :buyer-name="quotation.buyerName"
    :owner-name="quotation.ownerName"
    :currency="quotation.currency"
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

### `buyerName` / `ownerName`

```ts
buyerName?: string
ownerName?: string
```

Names already resolved to display strings — typically via `fullName(...)`.

- **Default:** `''`

### `currency`

```ts
currency?: string
```

Currency code or label.

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
