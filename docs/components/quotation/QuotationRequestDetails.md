# `QuotationRequestDetails`

`QuotationRequestDetails` is the read-only **Request details** card on a quotation — what the buyer sent with their request from the sales portal (`quotation.request`): the order details it brings (goods label, PO number / reference, desired delivery date) and their message. It's the only place a requested quotation shows its order details; they're never edited.

## Features

- Renders its own [`ContentEditCard`](/components/content/edit/ContentEditCard) titled "Request details"
- Same order and labels as [`QuotationOrderDetailsCard`](/components/quotation/QuotationOrderDetailsCard): goods label | PO number / reference, then desired delivery date, then the message full width; rows split by a top border like the other read-only quotation cards
- PO number / reference is `request.customerOrderNumber`, its name in the Sales Portal
- Formats the delivery date as a calendar day (its local midnight through [`useDate`](/composables/useDate)`().formatDate`), so it shows the requested day in any time zone
- Keeps the buyer's line breaks in the message (`whitespace-pre-line`)
- Renders `'-'` for missing values
- Leaves out `requestedValidTo` (only the buyer's wish; it never sets `validTo`) and `customerReference` (not used in Studio)

## Usage

The API omits `request` on quotations the seller started, so render it only when it's there. The quotation page shows it in the General layout, right after the quotation details card, in place of the order details card, so nothing shows twice.

```vue
<template>
  <QuotationRequestDetails
    v-if="quotation.request"
    :request="quotation.request"
  />
</template>
```

## Props

### `request`

```ts
request: QuotationRequest;
```

What the buyer sent with the request, as it stands now. Every field is optional and nullable. The same content also arrives as a `fromCustomer` message in the thread, which keeps the history.

## Dependencies

- [`ContentEditCard`](/components/content/edit/ContentEditCard)
- [`useDate`](/composables/useDate)
