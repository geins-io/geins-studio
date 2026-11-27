# `DashboardWidgetNeedsAttention`

The Needs attention dashboard widget: what needs doing right now, as three numbers with links to the lists behind them.

| Number               | Counts                                                         | Links to                                            |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Quotation requests   | Quotations with status `requested`                             | `/orders/quotations?status=requested`               |
| Quotations expiring  | `pending` quotations whose `validTo` is today or within 7 days | `/orders/quotations?status=pending&expiring=7d`     |
| Failed workflow runs | Workflow runs that failed in the last 24 hours                 | `/orchestrator/executions?status=failed&period=24h` |

## How it works

- The numbers come from [`useDashboardAttention`](/composables/useDashboardAttention.md) with all three keys (`DASHBOARD_ATTENTION_KEYS`), so it reads both [`useDashboardQuotations`](/composables/useDashboardQuotations.md) and [`useDashboardExecutions`](/composables/useDashboardExecutions.md). Always the whole account as it is now: the dashboard's period and Channel / Market filters don't apply.
- Each number is a [`DashboardAttentionCard`](/components/dashboard/DashboardAttentionCard.md) in a grid that fits as many 260px-wide columns as the widget allows, so the cards sit side by side when it's wide and stack when it's narrow. Each card loads and fails on its own.
- The widget is registered with `fit`: its height follows the cards (see [`DashboardWidget`](/components/dashboard/DashboardWidget.md#fitting-the-content)), one row of cards or two or three on a narrower widget, so it never scrolls, and the user resizes only its width. The card rows share the height left under the whole grid rows. Its default height (5 rows) is the fitted one with the cards in one row.
- The header's description is "What needs doing right now" (the registry's "All three numbers in one block" is for the Add widget panel), and its badge is the total once every number has loaded.
- Stacked on a phone it's as tall as its content (`stackedHeight: 'auto'`).

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
