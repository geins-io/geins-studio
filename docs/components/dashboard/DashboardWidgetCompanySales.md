# `DashboardWidgetCompanySales`

The Company sales dashboard widget (`chart-company-orders`, Charts group, 8×10, at least 4×10): **Demand** over the dashboard's period, as key numbers and a line or bar chart. Built from the `start-dashboard` prototype's `CompanyOrdersBar` (look "Bold").

## How it works

- **Data**: every wholesale order from [`useDashboardCompanyOrders`](/composables/useDashboardCompanyOrders.md), the fetch it shares with [Latest company orders](/components/dashboard/DashboardWidgetCompanyOrders.md). Totals are worked out in the browser by the pure functions in `app/lib/dashboard-sales.ts` (see [Dashboard → Company sales](/domains/dashboard.md#company-sales)), so a filter change sends no request.
- **Filters**: the period, channels and currency of [`useDashboardFilters`](/composables/useDashboardFilters.md). Orders have no market, so the Market filter only picks the currency; orders in another currency are left out, since sums can't mix currencies.
- **Key numbers**: Orders, Order value (ex. VAT), Average order value, Companies ordering, each with the change against the period before (`previousSalesRange`): green up, red down, grey when flat; `—` when there's nothing to compare with. Companies ordering shows the difference in companies, the others a percentage, as in the prototype.
- **Chart**: [`DashboardChart`](/components/dashboard/DashboardChart.md) with one series (Order value, `--tone-success`): per hour, day or month (`salesGranularity`), x ticks as times, days or months, y ticks short (`Intl` compact: 12K), the tooltip in full with the currency.
- **Line or bars**: a [`DashboardToggle`](/components/dashboard/DashboardToggle.md) with icon buttons beside the key numbers. The pick is saved in the instance's `config.kind` (`salesChartKind`, line by default) through the board's `updateConfig`, so two Company sales widgets can differ.
- **Header modes**: Demand / Revenue come from the registry's `modes` and are drawn by [`DashboardWidget`](/components/dashboard/DashboardWidget.md#header-modes). Revenue is disabled, with a tooltip: orders have no delivery date yet (project Phase 4).
- **Narrow**: below 680px of widget width (its own, not the screen's) the toggles get their own row above the key numbers, which go two by two.
- **States**: skeletons while loading; an error state with **Retry** (the fetch suppresses the global toast); the key numbers and a "No orders" empty state when nothing was ordered in the period.
- A minute clock (`useLiveClock`) keeps "now" current for a period that's still running and for "at this time" comparisons.

No refunds, cost or margin: Platform has no refund amounts or purchase prices on orders yet.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
