# `useDashboardFilters`

The start dashboard's filters: the period, and the channels and markets the widgets show. The page calls it once, which creates the state and provides it; every call below the page ([`DashboardFilterBar`](/components/dashboard/DashboardFilterBar.md), [`DashboardPeriodBar`](/components/dashboard/DashboardPeriodBar.md), the widgets) gets that same state. A component outside a dashboard page gets a state of its own, at Today and all.

Nothing is saved: a reload starts at Today with every channel and market.

## Period

- `period` is `{ preset, from, to }` as local dates: `from` at the start of the first day, `to` at the end of the last (inclusive).
- The presets are `today`, `yesterday`, `this_week` (weeks start on Monday), `last_7_days`, `this_month`, `last_30_days` and `ytd` (from 1 January). `presetRange(preset, now)` in `app/lib/dashboard.ts` turns one into dates.
- A preset follows the clock: on a page left open past midnight, Today moves to the new day. The clock ticks once a minute, but `period` only changes when the day does, so widgets aren't handed a new period every minute.
- `setCustomPeriod(from, to)` picks whole days from `from` to `to`, in either order; `preset` is then `custom`.

## Channels and markets

- `channelIds` and `marketIds` are the picked ids; empty means all.
- The markets on offer are the non-virtual markets of the channels in scope, each once (`dashboardMarketsFor`). `setChannelIds` drops picked markets the new channels don't have, and `setMarketIds` keeps only markets they have (`pruneDashboardMarkets`). Both write only when something changed.
- When the account's channels change (another account), picks it doesn't have are dropped.
- Orders carry a channel, no market: the channel filter applies to order widgets, the market filter to quotation widgets.

## Currency

`currency` is the currency the dashboard shows money in (`dashboardCurrency`):

1. The first picked market's currency, in the Market filter's order. Picked markets with different currencies are still an open question (project Phase 3).
2. With no market picked, the currency of the default market of the first channel in scope (the first picked channel, or the account's first channel).
3. Without channels, the account's default currency.

## Usage

```ts
// The page: creates and provides the state
useDashboardFilters();

// A widget: reads the same state
const { period, channelIds, marketIds, currency } = useDashboardFilters();
```

## Returns

| Property          | Type                                      | Meaning                                                 |
| ----------------- | ----------------------------------------- | ------------------------------------------------------- |
| `period`          | `ComputedRef<DashboardPeriod>`            | The picked period as local dates                        |
| `channelIds`      | `ComputedRef<string[]>`                   | Picked channel ids, empty for all                       |
| `marketIds`       | `ComputedRef<string[]>`                   | Picked market ids, empty for all                        |
| `currency`        | `ComputedRef<string>`                     | The currency to show money in                           |
| `setPeriodPreset` | `(preset: DashboardPeriodPreset) => void` | Picks a preset period                                   |
| `setCustomPeriod` | `(from: Date, to: Date) => void`          | Picks a custom period of whole days                     |
| `setChannelIds`   | `(ids: string[]) => void`                 | Picks channels and drops picked markets they don't have |
| `setMarketIds`    | `(ids: string[]) => void`                 | Picks markets, only ones the channels in scope have     |

## Related

- [Dashboard domain](/domains/dashboard.md#widgets-and-their-data): which widgets follow which filter
