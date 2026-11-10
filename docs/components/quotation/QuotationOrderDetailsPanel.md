# `QuotationOrderDetailsPanel`

`QuotationOrderDetailsPanel` edits the order details of a sent quotation in a [`PanelEdit`](/components/panel/PanelEdit) slide-in. It saves through `orderApi.quotation.updateOrderDetails`, a `PATCH quotation/{id}` whose body is `{ orderDetails }` and nothing else.

## Why a separate save

On `pending`, `expired` and `accepted` quotations the API refuses every update except the order details (and `validTo`). A full update would also rebuild the cart and reset the payment and shipping method the buyer chose at checkout, so the page's `useEntityEdit` update path is never used in these statuses. Saving the order details doesn't send the quotation again, and an `expired` quotation stays `expired`. Validity stays with the **Set new expiration date** action, whose `extend` call moves an expired quotation back to `pending`.

## Features

- The four [`QuotationOrderDetailsFields`](/components/quotation/QuotationOrderDetailsFields), validated by `createOrderDetailsSchema` against the stored values (a stored value can't be emptied; a changed delivery date must be after today)
- Reseeds its form on every open with `form.resetForm({ values }, { force: true })`, so nothing from an earlier open lingers
- Dirty state from [`usePanelDirty`](/composables/usePanelDirty); Save stays disabled until something changes, and closing with changes asks first
- Sends only the fields that changed (`orderDetailsRequest`), with the delivery date as a calendar day; closes without a request when nothing did
- On success shows the `entity_updated` toast for the quotation and emits `saved`; a failure reaches the global API error toast

## Usage

```vue
<template>
  <QuotationOrderDetailsPanel
    :quotation-id="quotationId"
    :order-details="storedOrderDetails"
    @saved="refreshEntityData()"
  >
    <Button variant="outline" size="sm">{{ $t('edit') }}</Button>
  </QuotationOrderDetailsPanel>
</template>
```

The default slot is the trigger. Refresh the quotation on `saved`; the status stays the same.

## Props

### `quotationId`

```ts
quotationId: string;
```

### `orderDetails`

```ts
orderDetails?: QuotationOrderDetails | null;
```

The stored order details: seeds the form and is what changes are measured against.

## Events

### `saved`

The order details were saved.

## Dependencies

- [`PanelEdit`](/components/panel/PanelEdit)
- [`usePanelDirty`](/composables/usePanelDirty)
- [`QuotationOrderDetailsFields`](/components/quotation/QuotationOrderDetailsFields)
