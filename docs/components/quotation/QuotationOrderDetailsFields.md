# `QuotationOrderDetailsFields`

`QuotationOrderDetailsFields` renders the order-detail form fields of a quotation: goods label, PO number / reference and desired delivery date. It holds no state; it binds to the `orderDetails.*` fields of the surrounding vee-validate form.

## Features

- Goods label | PO number / reference on the first row; desired delivery date on the second
- `customerOrderNumber` is labelled **PO number / reference**, its name in the Sales Portal. The API's `customerReference` isn't shown
- The delivery date picker starts tomorrow and can be cleared
- Turns the picked date into its local midnight before it reaches the form, so the picker shows the picked day in any time zone (see [Calendar days](#calendar-days))
- Validation messages come from the form's schema through `FormMessage`

## Usage

The quotation page renders it in the **Order details** card between Quotation details and Customer, only on a draft the seller created (`canEditOrderDetails()` in `shared/utils/quotation.ts`). The create step leaves it out, and a buyer's request shows its order details read-only in [`QuotationRequestDetails`](/components/quotation/QuotationRequestDetails).

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
- PO number / reference: at most 30 characters
- desired delivery date: after today, checked only once it differs from the stored date
- a stored value can't be emptied, only replaced

## Dependencies

- [`FormInputDate`](/components/form/input/FormInputDate)
- `@internationalized/date`
