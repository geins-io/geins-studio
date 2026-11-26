# `DashboardWidgetRecentQuotations`

The Latest quotations dashboard widget: the 10 most recently updated quotations as a compact table (company, total, status).

## How it works

- Reads `quotations` from [`useDashboardQuotations`](/composables/useDashboardQuotations.md) and keeps the 10 last changed (`recentQuotations`: `modifiedAt`, else `createdAt`, newest first).
- The rows render in a [`TableView`](/components/table/TableView.md#compact-mode-a-list-inside-a-card) in `TableMode.Compact`, like [Latest company orders](/components/dashboard/DashboardWidgetCompanyOrders.md): columns from `getColumns`, the total ex VAT as `currency`, the status as `status` ([`StatusBadge`](/components/StatusBadge.md)). The company column gets its own two-line cell: the company name (a link to the quotation, plain text while the board is edited) over `{quotation number} · {age}`.
- `TableView` brings the loading skeleton, the error state with **Retry** and the empty state ("No quotations").
- **View all** in the header opens the quotations list.
- Not filtered by Channel / Market yet: that comes with the filter bar.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
