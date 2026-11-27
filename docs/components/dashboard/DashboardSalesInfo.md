# `DashboardSalesInfo`

What Demand and Revenue count, shown in the info panel of [Company sales](/components/dashboard/DashboardWidgetCompanySales.md) (the `info` slot of [`DashboardWidget`](/components/dashboard/DashboardWidget.md#info-panel)). From the definitions in Merchant Center's statistics, as in the prototype's `SalesInfo`:

- **Demand**: what customers wanted to buy; counted on the date the order was placed, cancelled orders and products included.
- **Revenue**: what was actually delivered; counted on the delivery date, delivered orders only.
- An info [`Feedback`](/components/Feedback.md) with one order in both: placed 28 November, delivered 2 December.
- **The numbers**: what Order value, Revenue and Refunds mean.

Every text is an i18n key under `dashboards.sales.info` (the lists too), reusing `dashboards.sales.demand` / `revenue` / `order_value` for the headings and terms.

## Usage

```vue
<template>
  <DashboardWidget :instance="instance">
    …
    <template #info>
      <DashboardSalesInfo />
    </template>
  </DashboardWidget>
</template>
```

No props.
