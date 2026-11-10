# `QuotationOrderDetailsFields`

`QuotationOrderDetailsFields` renders the four order-detail form fields of a quotation: goods label, customer order number, desired delivery date and customer reference. It holds no state; it binds to the `orderDetails.*` fields of the surrounding vee-validate form.

## Features

- Goods label | customer order number on the first row; desired delivery date | customer reference on the second
- Labels the buyer's PO number as **Customer order number**, the name it gets on the order
- Customer reference carries a hint that it stays on the quotation and isn't added to the order
- The delivery date picker starts tomorrow and can be cleared
- Turns the picked date into its local midnight before it reaches the form, so the picker shows the picked day in any time zone (see [Calendar days](#calendar-days))
- Validation messages come from the form's schema through `FormMessage`

## Usage

Nest the values under `orderDetails` in the form and validate them with `createOrderDetailsSchema` (`app/utils/quotation-order-details.ts`). Seed the form with `orderDetailsFormValues(stored)` and build the request with `orderDetailsRequest(values, stored)` (`shared/utils/quotation.ts`).

```vue
<script setup lang="ts">
const form = useForm({
  validationSchema: toTypedSchema(
    z.object({
      orderDetails: createOrderDetailsSchema(t, () => quotation.orderDetails),
    }),
  ),
  initialValues: {
    orderDetails: orderDetailsFormValues(quotation.orderDetails),
  },
});
</script>

<template>
  <ContentEditCard
    :title="$t('orders.order_details')"
    :description="$t('orders.order_details_description')"
  >
    <QuotationOrderDetailsFields />
  </ContentEditCard>
</template>
```

## Calendar days

The desired delivery date names a day, not a moment. The API takes it as that day at UTC midnight (`YYYY-MM-DDT00:00:00Z`). `shared/utils/calendar-day.ts` holds the rule:

- `calendarDay(value)` — a value at exactly UTC midnight keeps its UTC date; any other instant names its local day
- `calendarDayToLocalIso(value)` — the day's local midnight, what the picker shows as that day
- `toCalendarDayIso(value)` — the day at UTC midnight, what the API takes

## Validation

`createOrderDetailsSchema(t, stored)` matches the API:

- goods label: at most 500 characters
- customer order number: at most 30 characters
- customer reference: at most 200 characters
- desired delivery date: after today, checked only once it differs from the stored date
- a stored value can't be emptied, only replaced

## Dependencies

- [`FormInputDate`](/components/form/input/FormInputDate)
- `@internationalized/date`
