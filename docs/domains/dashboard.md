# Dashboard Domain

> The start dashboard: a page of widgets each user arranges for themselves.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The start page (`/`) is a board of widgets on a 12-column grid: what needs attention, how company sales and quotations are going, and shortcuts to daily tasks. It uses only data Studio already has; there is no analytics endpoint behind it. The design is the `start-dashboard` prototype in `studio-prototypes` (look "Bold").

It is built in the long-lived `feat/dashboards` branch and merges into `next` once the PO approves it.

## Key concepts

**Widget registry** — `DASHBOARD_WIDGETS` (`app/lib/dashboard.ts`) holds one definition per `DashboardWidgetType`: title and description i18n keys, group (for the Add widget panel), Lucide icon, default and minimum size in grid units, body variant, stacked height. A widget is a component in `app/components/dashboard/widget/` that renders its own [`DashboardWidget`](/components/dashboard/DashboardWidget.md) frame; [`DashboardBoard`](/components/dashboard/DashboardBoard.md) maps types to components.

**Board** — `items` (widget instances: `i`, `type`, optional `config`) plus `layout` (`i`, `x`, `y`, `w`, `h`). An instance id is `{type}__{n}`, so the same widget can be on a board twice with different settings. [`useDashboard`](/composables/useDashboard.md) holds the board; `defaultDashboardBoard()` is where a user starts.

**Grid** — 12 columns, 28px rows, 16px gaps (`grid-layout-plus`). Below 640px of board width the widgets stack one per row in reading order.

## Widgets and their data

| Widget                | Reads                                                                               | Filters |
| --------------------- | ----------------------------------------------------------------------------------- | ------- |
| Quick access          | Nothing: links built from the entity registry                                       | —       |
| Latest company orders | `POST order/query` (all wholesale orders, no pagination) + `wholesale/account` list | —       |

## Known data gaps

What the prototype shows but Studio's data can't back yet (Platform work, project Phase 4):

- **Revenue**: orders have no delivery date, so only Demand (by order date) can be shown.
- **Refunds**: orders have a `refunded` status but no refund amount.
- **Market on orders**: orders carry `channel` and `currency`, no market. The market filter picks the sales currency and filters quotations only.
- **Order statistics**: the order query has no date filter or aggregation; sales numbers are totalled in the browser over all wholesale orders.
- **Quotation answer time** ("Answered within 24h"): needs request and send times per quotation.
