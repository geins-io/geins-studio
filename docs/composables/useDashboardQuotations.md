# `useDashboardQuotations`

The quotations the start dashboard's widgets read, fetched once for all of them.

## How it works

- `useAsyncData('dashboard-quotations')` calls `orderApi.quotation.list()` with `fields: ['company', 'revisions']`. Every widget that calls the composable shares the key, so the board makes one request, and **Retry** in any widget refetches for all of them. `dedupe: 'defer'` makes a widget set up while the fetch is in flight join it; Nuxt's default (`cancel`) would abort it and send the request again.
- The list is the quotation list page's: the API leaves out request drafts and revised versions, and `withoutLinkedRevisionDrafts` drops revision drafts a listed quotation links to.
- `suppressErrorToast: true`: a failed fetch shows in the widgets (error state with Retry), not as a toast.
- Always the account as it is now; the dashboard's period doesn't apply. With `scoped: true` (the list widgets), only quotations in the picked channels and markets of [`useDashboardFilters`](/composables/useDashboardFilters.md) (`inDashboardScope`: `channelId` and `marketId`, none picked = all); without it (Needs attention), the whole account. Filtering is client-side over the one shared fetch, so a filter change sends no request. The derived lists come from the pure functions in `app/lib/dashboard-data.ts`, with "now" taken as when the list was fetched:
  - **`requests`** (`quotationRequests`): status `requested`, newest request first (`request.releasedAt`, else `createdAt`).
  - **`expiring`** (`expiringQuotations`): status `pending` and `validTo` on today's calendar day or up to 7 days ahead, soonest first. A quotation without `validTo`, or whose day has passed, isn't expiring.

## Parameters

| Option   | Type      | Meaning                                                         |
| -------- | --------- | --------------------------------------------------------------- |
| `scoped` | `boolean` | Follow the dashboard's Channel and Market filters (default off) |

## Returns

| Property     | Type                       | Meaning                                                  |
| ------------ | -------------------------- | -------------------------------------------------------- |
| `quotations` | `ComputedRef<Quotation[]>` | Every quotation the list page shows                      |
| `requests`   | `ComputedRef<Quotation[]>` | Buyers' requests waiting for an answer, newest first     |
| `expiring`   | `ComputedRef<Quotation[]>` | Pending quotations expiring within 7 days, soonest first |
| `loading`    | `ComputedRef<boolean>`     | Whether the list is being fetched                        |
| `error`      | `ComputedRef<boolean>`     | Whether the fetch failed                                 |
| `refresh`    | `() => Promise<void>`      | Fetches the list again                                   |
