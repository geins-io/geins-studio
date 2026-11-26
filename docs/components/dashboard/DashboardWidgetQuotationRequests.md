# `DashboardWidgetQuotationRequests`

The Open quotation requests dashboard widget: buyers' requests waiting for an answer, newest first, as a [`DashboardQueue`](/components/dashboard/DashboardQueue.md).

## How it works

- Reads `requests` from [`useDashboardQuotations`](/composables/useDashboardQuotations.md) (status `requested`, the same quotations as the Needs attention number) and shows the newest 10 (`DASHBOARD_LIST_LIMIT`).
- Each row: the company's initials, the company name over the quotation number, how long ago the request came in (`formatRelativeDate` of `request.releasedAt`, else `createdAt`), and a Requested badge. It links to the quotation.
- **View all** in the header opens `/orders/quotations?status=requested`.
- Follows the dashboard's Channel and Market filters ([`useDashboardFilters`](/composables/useDashboardFilters.md)): it reads `useDashboardQuotations({ scoped: true })`.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
