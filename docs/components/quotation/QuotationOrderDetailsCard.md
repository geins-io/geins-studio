# `QuotationOrderDetailsCard`

`QuotationOrderDetailsCard` is the read-only **Order details** card on a read-only quotation without a buyer request (sent, or owned by an external system): goods label, PO number / reference and desired delivery date (`quotation.orderDetails`).

## Features

- Renders its own [`ContentEditCard`](/components/content/edit/ContentEditCard) titled "Order details", with the description that these values are added to the order when the quotation is finalized
- Same order and labels as the editable [`QuotationOrderDetailsFields`](/components/quotation/QuotationOrderDetailsFields): goods label | PO number / reference, then desired delivery date, rows split by a top border like the other read-only quotation cards
- Formats the delivery date as a calendar day (its local midnight through [`useDate`](/composables/useDate)`().formatDate`), so it shows the stored day in any time zone
- Renders `'-'` for missing values, and for a quotation without `orderDetails`

## Usage

The quotation page shows it in the read-only General layout, between the Quotation details and Customer cards, when the quotation has no buyer request. A request brings its own order details, shown in [`QuotationRequestDetails`](/components/quotation/QuotationRequestDetails) instead. Once sent, order details are locked, so the card has no edit action.

```vue
<template>
  <QuotationRequestDetails
    v-if="quotation.request"
    :request="quotation.request"
  />
  <QuotationOrderDetailsCard v-else :order-details="quotation.orderDetails" />
</template>
```

## Props

### `orderDetails`

```ts
orderDetails?: QuotationOrderDetails | null;
```

The stored order details. Every field is optional and nullable; the API leaves the object out when nothing is set.

## Dependencies

- [`ContentEditCard`](/components/content/edit/ContentEditCard)
- [`useDate`](/composables/useDate)
