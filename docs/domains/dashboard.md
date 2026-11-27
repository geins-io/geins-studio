# Dashboard Domain

> The start dashboard: a page of widgets each user arranges for themselves.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The start page (`/`) is a board of widgets on a 12-column grid: what needs attention, how company sales and quotations are going, and shortcuts to daily tasks. It uses only data Studio already has; there is no analytics endpoint behind it. The design is the `start-dashboard` prototype in `studio-prototypes` (look "Bold").

It is built in the long-lived `feat/dashboards` branch and merges into `next` once the PO approves it.

## Key concepts

**Widget registry** — `DASHBOARD_WIDGETS` (`app/lib/dashboard.ts`) holds one definition per `DashboardWidgetType`: title and description i18n keys, group (for the Add widget panel), Lucide icon, default and minimum size in grid units, body variant, stacked height. A widget can also have header `modes` (e.g. Demand / Revenue): a toggle in its header, the description per mode, the pick saved in its `config.mode`; a mode can be shown disabled with a reason. A widget is a component in `app/components/dashboard/widget/` that renders its own [`DashboardWidget`](/components/dashboard/DashboardWidget.md) frame; [`DashboardBoard`](/components/dashboard/DashboardBoard.md) maps types to components.

**Board** — `items` (widget instances: `i`, `type`, optional `config`) plus `layout` (`i`, `x`, `y`, `w`, `h`). An instance id is `{type}__{n}`, so the same widget can be on a board twice with different settings. [`useDashboard`](/composables/useDashboard.md) holds the board; `defaultDashboardBoard()` is where a user starts.

**Default board** — What a user sees until they save a board of their own: Needs attention across the top, Quick access the full width under it, then the three queues and the three lists, a third of the width each. Every column is filled from the top to one shared bottom, with no gaps or overlaps, and every widget is at least its minimum size. Needs attention and Quick access set their own height (see Fitted height), so they span the full width: a refit moves every widget below them alike. The prototype's charts (Company sales, with Quick access and Quotations by status beside it) arrive in project Phase 3, which grows the default again; a Quick access a third wide there needs another answer to its fitted height, and the default-board test that keeps fitted widgets full width changes with it. A user who saved a board keeps it; one who never changed anything, or whose board is the default again, gets each new default.

```text
y 0 ┌───────────────────────────────────────────────────────────┐
    │ Needs attention (height fits its cards)         12×5      │
y 5 ├───────────────────────────────────────────────────────────┤
    │ Quick access (height fits its shortcuts)        12×4      │
y 9 ├───────────────────┬───────────────────┬───────────────────┤
    │ Open quotation    │ Quotations        │ Latest failed     │
    │ requests      4×8 │ expiring soon 4×8 │ workflow runs 4×8 │
y17 ├───────────────────┼───────────────────┼───────────────────┤
    │ Latest company    │ Latest            │ Recently uploaded │
    │ orders       4×10 │ quotations   4×10 │ assets       4×10 │
y27 └───────────────────┴───────────────────┴───────────────────┘
```

**Saving** — Each user's board is kept in `localStorage`, per user and account (`geins-dashboard-{accountKey}-{userId}`), through [`useDashboardStorage`](/composables/useDashboardStorage.md) only. The saved shape is versioned (`version: 1`) and already holds a list of dashboards (`my-work` for now), so several dashboards and server-side saving (project Phase 5) change that one module. Done saves the board if it changed, but a board that is the default again clears the saved one instead, so the user follows the default as it grows. "The default" means the same widgets, settings and places once compacted, with the current fitted heights (`sameDashboardBoard`): a fitted widget (Needs attention, Quick access) taking a taller height moves the widgets below it, and that isn't a change. A widget's own settings save the whole board as soon as they change, even a board that is otherwise the default: a known limit until server-side saving (Phase 5).

**Reset to default** — In edit mode, **Reset to default** (before Add widget, regular colour: it's undoable) puts the default board back inside the edit session. Cancel brings the old board back exactly, widget settings included; Done keeps the default and clears the saved board. No confirm dialog, since Cancel undoes it, and it's disabled while the board already is the default. The prototype has no reset; it's how a user on an old saved board gets the growing default back.

**Adding widgets** — In edit mode, **Add widget** opens the [`DashboardAddWidgetPanel`](/components/dashboard/DashboardAddWidgetPanel.md): every registry widget, grouped (Needs attention, Charts, Lists, Shortcuts), searchable by title, with "N on board". **+** adds a widget at its default size on the left under every other widget; dragging a row onto the board drops it where the grid's placeholder shows. Either way the panel closes and the widget gets a new id, so the same widget can be added twice. Additions belong to the edit session: Cancel takes them back off, Done saves them.

**Empty board** — When every widget has been removed, the page shows the `Empty` state ("Build your dashboard") with **Add widget** (enters edit mode and opens the panel) and **Use the default dashboard** (`resetToDefault`), so a saved empty board is never a dead end. Outside edit mode it clears the saved board right away; in edit mode it's part of the session, like Reset to default. With no grid on the page, an empty board takes widgets from + only, not by dragging.

**Filters** — The row under the tabs ([`DashboardFilterBar`](/components/dashboard/DashboardFilterBar.md)): the period (Today, Yesterday, This week, Last 7 days, This month, Last 30 days, YTD, Custom; weeks start on Monday), then **Channel** and **Market**, the list pages' filter buttons. Nothing checked is all; the market options follow the picked channels, and changing channels drops markets they don't have. [`useDashboardFilters`](/composables/useDashboardFilters.md) holds the state: the page creates it and every widget reads the same one. It also gives the dashboard's `currency`: the first picked market's, or with no market picked the default currency of the first channel in scope (decided 24 Nov 2026). Picked markets with different currencies use the first one's for now; that question is still open for Phase 3. Filters aren't saved: a reload starts at Today and all.

**Grid** — 12 columns, 28px rows, 16px gaps (`grid-layout-plus`). Below 640px of board width the widgets stack one per row in reading order.

**Fitted height** — A widget registered with `fit` (Needs attention, Quick access) has the height its content needs: the widget frame measures the content at its natural height and reports it in grid rows (`fitWidget`), and the user resizes only its width. The height follows the width and settings, so it isn't saved on its own. Whole rows leave up to a row's height over; the widget's rows of tiles or cards share it, so the space above and below them stays even.

**Widget settings** — A widget with settings has a sliders button in its header ([`DashboardWidgetSettings`](/components/dashboard/DashboardWidgetSettings.md)) that opens a narrow panel. Settings live in the instance's `config` and save as soon as the panel's Save is clicked, in or outside edit mode.

**Quick access shortcuts** — `QUICK_ACCESS_SHORTCUTS`: create a company, companies, create a price list, price lists, quotations, asset library, upload assets, workflows, workflow runs (the Executions page, labelled "Executions" as in the navigation) and channels. URLs come from the entity registry; ids are saved in `config.shortcuts`, so they must stay stable. The default is the four links the start page had before the dashboard.

## Widgets and their data

| Widget                      | Reads                                                                                                            | Filters                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Quick access                | Nothing: links built from the entity registry                                                                    | —                                    |
| Company sales               | All wholesale orders (`useDashboardCompanyOrders`), totalled in the browser (below)                              | Period / Channel / Market (currency) |
| Latest company orders       | All wholesale orders (`useDashboardCompanyOrders`: `POST order/query`, no pagination) + `wholesale/account` list | Channel                              |
| Needs attention             | Quotation requests, expiring quotations and failed workflow runs (below)                                         | —                                    |
| Single numbers (×3)         | One of the Needs attention numbers each                                                                          | —                                    |
| Open quotation requests     | Quotation requests, newest first (`useDashboardQuotations`)                                                      | Channel / Market                     |
| Quotations expiring soon    | Expiring quotations, soonest first (`useDashboardQuotations`)                                                    | Channel / Market                     |
| Latest failed workflow runs | Failed runs, newest first (`useDashboardExecutions`)                                                             | —                                    |
| Latest quotations           | The 10 last changed quotations (`useDashboardQuotations`)                                                        | Channel / Market                     |
| Recently uploaded assets    | `POST media/assets/query` (10 newest live assets by `createdAt`) + `user` list (uploader names)                  | —                                    |

**Needs attention** counts what needs doing right now, so it ignores the period and Channel / Market. Its definitions live in `app/lib/dashboard-data.ts` (pure, tested) and every widget reads them through one shared fetch per source:

- **Quotation requests**: quotations with status `requested`. [`useDashboardQuotations`](/composables/useDashboardQuotations.md) fetches `orderApi.quotation.list()` (the list page's quotations: no request drafts, revised versions or linked revision drafts).
- **Quotations expiring**: status `pending` with `validTo` on today's calendar day or up to 7 days ahead. A passed day or a missing `validTo` doesn't count.
- **Failed workflow runs**: runs with status `Failed` that started in the last 24 hours, from `GET orchestrator/executions/logs` ([`useDashboardExecutions`](/composables/useDashboardExecutions.md)).

Each number links to its list with the filter in the query (`?status=requested`, `?status=pending&expiring=7d`, `?status=failed&period=24h`), from `DASHBOARD_ATTENTION`. The quotations list reads `status` / `expiring` and the workflow runs list `status` once their link filters land; until then those links open the list unfiltered (the runs list already reads `period`).

The **list widgets** read the same two fetches, so a board with Needs attention and every list makes one quotations request and one workflow runs request. Each list shows 10 rows (`DASHBOARD_LIST_LIMIT`) and a **View all** link to the same filtered list. Queues are [`DashboardQueue`](/components/dashboard/DashboardQueue.md)s; Latest quotations is a compact `TableView`.

## Company sales

The Company sales chart shows **Demand**: company orders counted on the day they were placed (`dateCreated`, local time), whatever their status, so cancelled orders count too. **Revenue** (by delivery date) is in the header toggle but disabled until orders have delivery dates (Phase 4). Its definitions live in `app/lib/dashboard-sales.ts` (pure, tested), over the one shared order fetch ([`useDashboardCompanyOrders`](/composables/useDashboardCompanyOrders.md)) that Latest company orders reads too:

- **Which orders**: wholesale orders placed in the period up to now, in the picked channels (an order's `channel`), and in the dashboard currency. Orders have no market, so the Market filter only picks the currency; orders in other currencies are left out, since sums can't mix them.
- **Steps**: per hour for one day (Today, Yesterday, a one-day custom period), per month for YTD and for custom periods over 92 days, per day otherwise. A period that's still running stops at the current hour or day; there are no empty steps in the future.
- **Key numbers**: Orders (count), Order value (sum of `sumExVat`: ex. VAT, after discounts), Average order value (value ÷ orders), Companies ordering (distinct `wholesaleAccountId`).
- **Compared with**: Today with yesterday at this time; This week, This month and YTD with the week, month or year before up to the same point ("at this time"; a shorter month stops at its last day); Yesterday with the day before; Last 7 / 30 days and Custom with the same number of days right before, cut at this time while the period is still running. The change is a percentage, Companies ordering a difference; nothing to compare with shows `—`.

No refunds, cost or margin (see below).

## Known data gaps

What the prototype shows but Studio's data can't back yet (Platform work, project Phase 4):

- **Revenue**: orders have no delivery date, so only Demand (by order date) can be shown.
- **Refunds**: orders have a `refunded` status but no refund amount.
- **Market on orders**: orders carry `channel` and `currency`, no market. The market filter picks the sales currency and filters quotations only.
- **Order statistics**: the order query has no date filter or aggregation; sales numbers are totalled in the browser over all wholesale orders.
- **Quotation answer time** ("Answered within 24h"): needs request and send times per quotation.
