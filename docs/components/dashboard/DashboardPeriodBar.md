# `DashboardPeriodBar`

The period control in the start dashboard's [`DashboardFilterBar`](/components/dashboard/DashboardFilterBar.md): Today, Yesterday, This week, Last 7 days, This month, Last 30 days, YTD and Custom. It reads and writes `period` in [`useDashboardFilters`](/composables/useDashboardFilters.md), so it needs no props.

## Features

- **Wide filter row (64rem, 1024px, and up):** a segmented bar, one button per preset, the picked one raised. A click applies the preset. **Custom** opens a popover with a two-month range calendar; it shows the picked dates ("1 Nov – 5 Nov") once a custom period is applied.
- **Narrower filter row:** one button with the current period and a menu: the presets (the picked one checked), then "Custom range…", which turns the menu into the calendar. Cancel goes back to the presets.
- **Calendar:** starts on the current period, weeks start on Monday, no dates after today, two months side by side from 640px (the last one is the period's end month), one below. The footer shows the picked dates ("Pick a start and end date" until there are any) with **Cancel** and **Apply**; nothing applies until Apply, and Apply needs both ends.
- A `role="group"` of `aria-pressed` buttons rather than tabs: there are no panels to switch.

## Usage

```vue
<DashboardPeriodBar />
```

## Dependencies

- shadcn-vue `RangeCalendar`, `Popover`, `Button`, `Separator`
- [`useDashboardFilters`](/composables/useDashboardFilters.md), `DASHBOARD_PERIOD_PRESETS` in `app/lib/dashboard.ts`
