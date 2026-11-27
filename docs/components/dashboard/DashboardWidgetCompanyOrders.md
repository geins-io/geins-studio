# `DashboardWidgetCompanyOrders`

The Latest company orders dashboard widget: the 10 newest wholesale orders as a compact table (company, sum, status).

## How it works

- The orders come from [`useDashboardCompanyOrders`](/composables/useDashboardCompanyOrders.md), the fetch it shares with [Company sales](/components/dashboard/DashboardWidgetCompanySales.md): every wholesale order, newest first. The company names come from `useAsyncData('dashboard-companies')` (`customerApi.company.list()`). The widget is loading or failed while either fetch is, and **Retry** refetches both.
- It keeps the orders in the picked channels ([`useDashboardFilters`](/composables/useDashboardFilters.md) `channelIds`, all when none is picked; an order's `channel` is its channel id) and shows 10. The fetch keeps every wholesale order, so a channel change narrows the rows without a new fetch. The market filter doesn't apply: orders have no market. Each row shows the company name (a link to the company), `#{order id} · {date}`, the sum including VAT with its currency, and the order's [`StatusBadge`](/components/StatusBadge.md).
- It doesn't use [`useCompanyOrders`](/composables/useCompanyOrders.md): that composable's rows drop the company id the link needs.
- The rows render in a [`TableView`](/components/table/TableView.md#compact-mode-a-list-inside-a-card) in `TableMode.Compact`, with columns from `getColumns` (`sum` as `currency`, `status` as `status`). The company column gets its own two-line cell: the company link over the order number and date.
- `TableView` brings the loading skeleton, the error state with **Retry** and the empty state ("No orders").

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
