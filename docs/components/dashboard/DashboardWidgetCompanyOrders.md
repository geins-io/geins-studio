# `DashboardWidgetCompanyOrders`

The Latest company orders dashboard widget: the 10 newest wholesale orders as a compact table (company, sum, status).

## How it works

- One `useAsyncData('dashboard-company-orders')` fetches the companies (`customerApi.company.list()`) and every wholesale order (`orderApi.query` with an `orderTypes: ['wholesale']` selection and no pagination) in parallel. The global error toast is suppressed; the widget shows the error itself.
- It sorts by `dateCreated`, newest first, and keeps 10. Each row shows the company name (a link to the company), `#{order id} · {date}`, the sum including VAT with its currency, and the order's [`StatusBadge`](/components/StatusBadge.md).
- It fetches on its own rather than through [`useCompanyOrders`](/composables/useCompanyOrders.md): that composable's rows drop the company id the link needs.
- The rows render in a [`TableView`](/components/table/TableView.md#compact-mode-a-list-inside-a-card) in `TableMode.Compact`, with columns from `getColumns` (`sum` as `currency`, `status` as `status`). The company column gets its own two-line cell: the company link over the order number and date.
- `TableView` brings the loading skeleton, the error state with **Retry** (`refresh()`) and the empty state ("No orders").

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
