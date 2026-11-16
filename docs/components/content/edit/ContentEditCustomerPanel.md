# `ContentEditCustomerPanel`

`ContentEditCustomerPanel` is the sheet for changing a quotation's customer details — buyer, billing address, and shipping address — chosen from the existing data attached to the company. The quotation owner isn't part of it: it's a field in the Quotation details card.

## Features

- Three `Select` dropdowns: buyer, billing address, shipping address
- Address dropdowns filter by `addressType` — billing pulls `billing` + `billingandshipping`, shipping pulls `shipping` + `billingandshipping`
- Single-line address summary `"Addr 1, ZIP, City, Country"` for the trigger label
- Local state — only commits changes on Save; Cancel discards
- Syncs from the `current*Id` props each time the sheet opens

## Usage

```vue
<script setup lang="ts">
const onSave = (data: {
  buyerId: string;
  billingAddressId: string;
  shippingAddressId: string;
}) => updateCustomerDetails(data);
</script>

<template>
  <ContentEditCustomerPanel
    :company="quotation.company"
    :available-buyers="quotation.company.buyers"
    :current-buyer-id="quotation.buyerId"
    :current-billing-address-id="quotation.billingAddressId"
    :current-shipping-address-id="quotation.shippingAddressId"
    @save="onSave"
  >
    <Button variant="outline">
      {{ $t('orders.change_customer_details') }}
    </Button>
  </ContentEditCustomerPanel>
</template>
```

## Props

### `company`

```ts
company: CustomerCompany | undefined;
```

Source of `addresses` for the billing/shipping selects.

### `availableBuyers`

```ts
availableBuyers: CompanyBuyer[]
```

Buyer dropdown options.

### `currentBuyerId` / `currentBillingAddressId` / `currentShippingAddressId`

```ts
currentBuyerId: string
currentBillingAddressId?: string
currentShippingAddressId?: string
```

Pre-selected values populated when the sheet opens.

### `buyerDisabledReason`

```ts
buyerDisabledReason?: string
```

Locks the buyer select and shows this text under it, already translated. The addresses stay editable. The quotation page passes it on a revision draft, since a revision keeps its buyer (the API answers `422` to a change).

## Events

### `save`

```ts
(data: { buyerId: string; billingAddressId: string; shippingAddressId: string }): void
```

Emitted on Save with the three selected ids. Parent owns the API call.

## Slots

### default

The `SheetTrigger` content.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Select`, `Button`, `Label`
- [`useAccountStore`](/stores/account) — `getCountryNameById` for the address summary
- `fullName` utility for buyer labels
