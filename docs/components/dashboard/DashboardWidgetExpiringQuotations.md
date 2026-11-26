# `DashboardWidgetExpiringQuotations`

The Quotations expiring soon dashboard widget: sent quotations the buyer hasn't answered that expire within 7 days, soonest first, as a [`DashboardQueue`](/components/dashboard/DashboardQueue.md).

## How it works

- Reads `expiring` from [`useDashboardQuotations`](/composables/useDashboardQuotations.md) (status `pending`, `validTo` today or within 7 calendar days) and shows the first 10 (`DASHBOARD_LIST_LIMIT`).
- Each row: the company's initials, the company name over `{quotation number} · {total ex VAT} {currency}`, and when it expires: `calendarDaysUntil(validTo)` read by `formatRelativeDays` ("Expires today", "Expires tomorrow", "Expires in 3 days"). It links to the quotation.
- **View all** in the header opens `/orders/quotations?status=pending&expiring=7d`.
- Not filtered by Channel / Market yet: that comes with the filter bar.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
