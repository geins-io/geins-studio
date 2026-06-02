# `ContentEditCustomerPanel`

`ContentEditCustomerPanel` is the sheet for changing a quotation's customer details — owner, buyer, billing address, and shipping address — chosen from the existing data attached to the company.

## Features

- Four `Select` dropdowns: owner (sales rep), buyer, billing address, shipping address
- Address dropdowns filter by `addressType` — billing pulls `billing` + `billingandshipping`, shipping pulls `shipping` + `billingandshipping`
- Single-line address summary `"Addr 1, ZIP, City, Country"` for the trigger label
- Local state — only commits changes on Save; Cancel discards
- Syncs from the `current*Id` props each time the sheet opens

## Usage

```vue
<script setup lang="ts">
const onSave = (data: {
  ownerId: string;
  buyerId: string;
  billingAddressId: string;
  shippingAddressId: string;
}) => updateCustomerDetails(data);
</script>

<template>
  <ContentEditCustomerPanel
    :company="quotation.company"
    :available-sales-reps="salesReps"
    :available-buyers="quotation.company.buyers"
    :current-owner-id="quotation.ownerId"
    :current-buyer-id="quotation.buyerId"
    :current-billing-address-id="quotation.billingAddressId"
    :current-shipping-address-id="quotation.shippingAddressId"
    @save="onSave"
  >
    <Button variant="outline">{{ $t('orders.change_customer_details') }}</Button>
  </ContentEditCustomerPanel>
</template>
```

## Props

### `company`

```ts
company: CustomerCompany | undefined
```

Source of `addresses` for the billing/shipping selects.

### `availableSalesReps`

```ts
availableSalesReps: CustomerSalesRep[]
```

Owner dropdown options.

### `availableBuyers`

```ts
availableBuyers: CompanyBuyer[]
```

Buyer dropdown options.

### `currentOwnerId` / `currentBuyerId` / `currentBillingAddressId` / `currentShippingAddressId`

```ts
currentOwnerId: string
currentBuyerId: string
currentBillingAddressId?: string
currentShippingAddressId?: string
```

Pre-selected values populated when the sheet opens.

## Events

### `save`

```ts
(data: { ownerId: string; buyerId: string; billingAddressId: string; shippingAddressId: string }): void
```

Emitted on Save with the four selected ids. Parent owns the API call.

## Slots

### default

The `SheetTrigger` content.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Select`, `Button`, `Label`
- [`useAccountStore`](/stores/account) — `getCountryNameById` for the address summary
- `fullName` utility for owner/buyer labels
