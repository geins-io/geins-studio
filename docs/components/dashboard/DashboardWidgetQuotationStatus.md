# `DashboardWidgetQuotationStatus`

The Quotations by status dashboard widget (Charts group): every sent quotation by its current status as a ring, with each status's share beside it and two rates under a line.

## How it works

- Reads `quotations` from [`useDashboardQuotations`](/composables/useDashboardQuotations.md) and counts them with `quotationStatusSummary` (`app/lib/dashboard-data.ts`). The current status of all quotations: the dashboard's period doesn't apply, the Channel and Market filters do (`useDashboardQuotations({ scoped: true })`).
- **Ring**: a shadcn-vue Chart (`ChartContainer`, Unovis `VisSingleContainer` + `VisDonut`), 124px, the total in the middle ("46 quotations"). Statuses with no quotations get no segment. The ring itself is `aria-hidden`: screen readers get the total in the middle and the legend's shares.
- **Legend**: one row per slice in `QUOTATION_STATUS_SLICES` order — Requested, Pending, Accepted, Expired, Rejected, and Canceled when there are any — with the status label the quotations list shows (`statusBadgeLabel`) and its share of the total. A row links to the quotations list filtered by its statuses (`quotationListLink`, e.g. `?status=accepted,confirmed,finalized`); plain text while the board is edited.
- **Rates**: Win rate ("Accepted of all answered") and Expired without answer, each as a thin [`Progress`](https://www.shadcn-vue.com/docs/components/progress) bar in the success tone. "–" with an empty bar when there's nothing to divide by.
- Loading skeleton (ring, legend and rate rows), the error state with **Retry**, and the empty state ("No quotations") when no sent quotation is in scope.

## Colours

The status badges' tones (`--tone-*`, see [`StatusBadge`](/components/StatusBadge.md)), never raw hex: Requested info, Pending info at 45%, Accepted success, Expired warning, Rejected danger, Canceled danger at 45%. Pending and Canceled are faded because their badges share a tone with the slice before them. The colours go into the chart's `ChartConfig`, so the segments read them as `--color-{key}`; the legend dots use the same values.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
