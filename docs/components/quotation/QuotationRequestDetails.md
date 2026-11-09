# `QuotationRequestDetails`

`QuotationRequestDetails` is the read-only **Request details** card on a quotation — what the buyer sent with their request from the sales portal (`quotation.request`): desired delivery date, goods label, their own reference and their message.

## Features

- Renders its own [`ContentEditCard`](/components/content/edit/ContentEditCard) titled "Request details"
- Desired delivery date | goods label on the first row; customer reference and message full width below, rows split by a top border like the other read-only quotation cards
- Formats the delivery date with [`useDate`](/composables/useDate)`().formatDate`
- Keeps the buyer's line breaks in the message (`whitespace-pre-line`)
- Renders `'-'` for missing values
- Leaves out `requestedValidTo` (shown as a hint under the Expiration date field instead) and `customerOrderNumber` (the PO number belongs to the order details)

## Usage

The API omits `request` on quotations the seller started, so render it only when it's there. The quotation page shows it in both the editable and the read-only General layout, right after the quotation details card.

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
