# `useDashboardCompanyOrders`

Every wholesale order, newest first, fetched once for all the start dashboard's widgets that read orders: [Latest company orders](/components/dashboard/DashboardWidgetCompanyOrders.md) and [Company sales](/components/dashboard/DashboardWidgetCompanySales.md).

## How it works

- `useAsyncData('dashboard-company-orders')` calls `orderApi.query` with an `orderTypes: ['wholesale']` selection and no pagination (`useBatchQuery().batchQueryNoPagination`). Every widget that calls the composable shares the key, so the board makes one request, and **Retry** in any widget refetches for all of them. `dedupe: 'defer'` makes a widget set up while the fetch is in flight join it.
- `suppressErrorToast: true`: a failed fetch shows in the widgets, not as a toast.
- The order query has no date filter or aggregation, so widgets narrow and total the list themselves; a filter change sends no request.

## Returns

| Property  | Type                   | Meaning                              |
| --------- | ---------------------- | ------------------------------------ |
| `orders`  | `ComputedRef<Order[]>` | All wholesale orders, newest first   |
| `loading` | `ComputedRef<boolean>` | Whether the orders are being fetched |
| `error`   | `ComputedRef<boolean>` | Whether the fetch failed             |
| `refresh` | `() => Promise<void>`  | Fetches the orders again             |
