# `DashboardFilterBar`

The start dashboard's filter row, under the tabs: the [`DashboardPeriodBar`](/components/dashboard/DashboardPeriodBar.md), then the **Channel** and **Market** filter buttons. It reads and writes [`useDashboardFilters`](/composables/useDashboardFilters.md), so it needs no props.

## How it works

- The Channel and Market buttons are the list pages' [`ListFilterPinned`](/components/list/filter/ListFilterPinned.md) buttons over a [`useListFilters`](/composables/useListFilters.md) instance. That instance's filter state is a computed over `channelIds` and `marketIds`, so the dashboard's filter state stays the single source.
- Channel options are the account's channels (`useAccountStore().channels`), Market options the markets of the picked channels (`dashboardMarketsFor`), labelled "Country (currency)". Nothing checked means all.
- Picking channels writes the channels first and then the markets, so picked markets the new channels don't have are dropped. Each toggle applies straight away, like on the list pages.
- The row is an `@container`: the period bar shows its segments only when the row is 64rem (1024px) or wider, which with the sidebar open is a wide screen, and is one menu button below that. The row wraps, so there is no sideways scrolling.

## Usage

```vue
<DashboardFilterBar />
```

The page calls `useDashboardFilters()` first, so the bar and the widgets share its state.

## Dependencies

- [`DashboardPeriodBar`](/components/dashboard/DashboardPeriodBar.md)
- [`ListFilterPinned`](/components/list/filter/ListFilterPinned.md), [`useListFilters`](/composables/useListFilters.md)
- [`useDashboardFilters`](/composables/useDashboardFilters.md)
