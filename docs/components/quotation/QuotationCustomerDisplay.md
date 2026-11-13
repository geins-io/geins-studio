# `QuotationCustomerDisplay`

`QuotationCustomerDisplay` is the read-only customer summary block on a quotation — company name + VAT, billing + shipping addresses, and buyer, in a 2-column grid with skeleton loading. Once the buyer accepts or rejects, a line under their name says which and when. The quotation owner isn't part of it: it shows in the Quotation details card.

## Features

- Three sections in a stacked 2-column grid — company / addresses / buyer
- Skeleton placeholders for every value when `loading` is `true`
- Renders `'-'` for missing values
- "Accepted {date}" or "Rejected {date}" under the buyer's name once the buyer has acted (via `quotationBuyerDecision` in `#shared/utils/quotation`; if both dates are set, the later one wins). Nothing shows while both are null
- Routes addresses through [`ContentAddressDisplay`](/components/content/ContentAddressDisplay) with `address-only` so the company line isn't duplicated

## Usage

```vue
<template>
  <QuotationCustomerDisplay
    :company-name="quotation.company.name"
    :vat-number="quotation.company.vatNumber"
    :billing-address="quotation.billingAddress"
    :shipping-address="quotation.shippingAddress"
    :buyer-name="fullName(quotation.customer)"
    :approved-at="quotation.customer?.approvedAt"
    :rejected-at="quotation.customer?.rejectedAt"
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

### `approvedAt` / `rejectedAt`

```ts
approvedAt?: string | null
rejectedAt?: string | null
```

When the buyer accepted or rejected the quotation — `customer.approvedAt` / `customer.rejectedAt` from the quotation response. Formatted with `useDate().formatDate`; hidden while `loading`.

- **Default:** `null`

### `loading`

```ts
loading?: boolean
```

Renders `Skeleton` placeholders in place of values.

- **Default:** `false`

## Dependencies

- shadcn-vue `Skeleton`
- `useDate` — formats the accept/reject date
- [`ContentAddressDisplay`](/components/content/ContentAddressDisplay) — both address blocks
