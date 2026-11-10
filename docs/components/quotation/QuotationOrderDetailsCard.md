# `QuotationOrderDetailsCard`

`QuotationOrderDetailsCard` is the read-only **Order details** card on a sent quotation: goods label, customer order number, desired delivery date and customer reference (`quotation.orderDetails`).

## Features

- Renders its own [`ContentEditCard`](/components/content/edit/ContentEditCard) titled "Order details", with the description that these values are added to the order when the quotation is finalized
- Same order and labels as the editable [`QuotationOrderDetailsFields`](/components/quotation/QuotationOrderDetailsFields): goods label | customer order number, then desired delivery date | customer reference, rows split by a top border like the other read-only quotation cards
- Formats the delivery date as a calendar day (its local midnight through [`useDate`](/composables/useDate)`().formatDate`), so it shows the stored day in any time zone
- Renders `'-'` for missing values, and for a quotation without `orderDetails`
- An optional `action` slot fills the card header, e.g. the edit button that opens [`QuotationOrderDetailsPanel`](/components/quotation/QuotationOrderDetailsPanel)

## Usage

The quotation page shows it in the read-only General layout for every status, after the quotation details card. The edit action is there only on `pending`, `expired` and `accepted` quotations that no external system owns (`canEditSentOrderDetails()` in `shared/utils/quotation.ts`).

```vue
<template>
  <QuotationOrderDetailsCard :order-details="quotation.orderDetails">
    <template v-if="canEditOrderDetails" #action>
      <QuotationOrderDetailsPanel
        :quotation-id="quotation._id"
        :order-details="quotation.orderDetails"
        @saved="refresh"
      >
        <Button variant="outline" size="sm">{{ $t('edit') }}</Button>
      </QuotationOrderDetailsPanel>
    </template>
  </QuotationOrderDetailsCard>
</template>
```

## Props

### `orderDetails`

```ts
orderDetails?: QuotationOrderDetails | null;
```

The stored order details. Every field is optional and nullable; the API leaves the object out when nothing is set.

## Slots

### `action`

Content for the card header, next to the title.

## Dependencies

- [`ContentEditCard`](/components/content/edit/ContentEditCard)
- [`useDate`](/composables/useDate)
