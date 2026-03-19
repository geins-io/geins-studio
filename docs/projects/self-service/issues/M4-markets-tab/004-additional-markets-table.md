---
title: 'Implement additional markets table with activate toggle and remove'
project: 'Self Service (Channels)'
milestone: 'M4 — Markets Tab'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './001-table-cell-switch.md'
  - './002-default-market-section.md'
  - './003-add-market-dialog.md'
model: sonnet
mode: claude-code agent
---

## Context

Below the default market section in the "Markets" `ContentEditCard`, all non-default assigned markets are listed in a minimal table. Users can toggle each market's active state inline and remove markets from the channel. The "+ Add" button opens `ChannelAddMarketDialog` (from issue 003). All mutations accumulate in local state and persist via the channel PATCH when the user hits Save.

## Expected Outcome

The additional markets section within the "Markets" `ContentEditCard` shows:
1. A minimal table of non-default assigned markets: Country (flag + name), Currency, VAT, Group, Active (`TableCellSwitch`), Remove (icon button).
2. A `+ Add` button in the section header (Lucide `Plus` icon) that opens `ChannelAddMarketDialog`.
3. A remove confirmation `AlertDialog` before detaching a market.
4. All mutations update `channelMarkets` and `entityDataUpdate.markets` immediately; save is deferred to the channel PATCH.

## Implementation Notes

### Table setup

Use `TableMode.Minimal` with `useColumns.getColumns()` (`sortable: false`):

- **Country** — custom cell via `extendColumns`: `h()` with `countryCodeToFlagEmoji(row.country.code) + ' ' + row.country.name`. Header via `getBasicHeaderStyle(table)`.
- **Currency** — plain text `row.currency.code`.
- **VAT** — plain text `${row.vat ?? '—'}%`.
- **Group** — plain text `row.group ?? '—'`.
- **Active** — custom cell via `extendColumns`: `h(TableCellSwitch, { value: row.active, onChange: (v) => handleToggleActive(row._id, v), disabled: isActivating(row._id) })`.
- **Remove** — custom cell: `Button` variant `ghost` size `icon` with Lucide `Trash2`. Only rendered for non-default markets (index > 0 in `channelMarkets`). Clicking sets `marketPendingRemoval.value` and opens the `AlertDialog`.

Table data: `channelMarkets.value` filtered to exclude index 0 (the default market).

### Activate/deactivate toggle

`handleToggleActive(id, active)`:
1. Update the matching entry in `channelMarkets.value[n].active` (the display ref).
2. The watcher from issue 002 syncs this to `entityDataUpdate.markets`.
3. Market activation publishes backend events — provide UX guardrails (same pattern as channel activate in M1/004):
   - Track activating markets with a `Set<string>` ref (`activatingMarkets`). Add `id` before the toggle, remove after a 3-second `setTimeout`.
   - `isActivating(id)` checks `activatingMarkets.has(id)` — used to disable the switch briefly.
   - Show a brief inline notice (not a toast) below the table: `"Activating a market triggers background processing. This may take a moment."` Visible while `activatingMarkets.size > 0`, hidden otherwise.

### Remove market

- `AlertDialog` with:
  - Title: `t('channel.remove_market')`
  - Description: `t('channel.remove_market_description')`
  - Cancel + Confirm (destructive variant) buttons.
- `marketPendingRemoval: Ref<string | null>` holds the `_id` of the market to remove.
- On confirm: filter `marketPendingRemoval.value` out of `channelMarkets.value`; the watcher syncs to `entityDataUpdate.markets`. Close dialog.
- The remove button must not appear on the default market row (index 0 in `channelMarkets`).

### Add market integration

- `ChannelAddMarketDialog` controlled by `showAddMarketDialog: Ref<boolean>`.
- Pass `:allMarkets="allSystemMarkets"` (fetched once in `[id].vue` via `useAsyncData(() => channelApi.market.listAll())`) and `:assignedMarketIds` as a computed from `channelMarkets.value.map(m => m._id)`.
- On `@add`: push new `ChannelMarket` objects to `channelMarkets.value`. Build display objects by looking up each ID in `allSystemMarkets`. New markets default to `active: true`.

### Data flow and `hasUnsavedChanges`

- `channelMarkets: Ref<ChannelMarket[]>` is the local display ref (established in issue 002).
- The `watch(channelMarkets, ...)` from issue 002 keeps `entityDataUpdate.markets` in sync with deep equality, triggering `hasUnsavedChanges`.
- No separate watcher needed here — mutations to `channelMarkets` automatically propagate.

### Empty state

When `channelMarkets.value.length <= 1` (only default or none), show an empty state message in the table area: `t('channel.no_additional_markets')`.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.additional_markets` (section subtitle)
- `channel.remove_market` (AlertDialog title)
- `channel.remove_market_description`
- `channel.no_additional_markets` (empty state)
- `channel.activating_market_notice`

## Acceptance Criteria

- Additional markets table renders all assigned markets except `channelMarkets[0]` (the default).
- Table uses `TableMode.Minimal`; no pagination, sorting, or outer border.
- Each row shows: country (flag + name), currency, VAT, group, active `TableCellSwitch`, remove button.
- Remove button is absent on the default market row.
- Toggling the active switch updates `channelMarkets` and `entityDataUpdate.markets`; the switch is disabled for 3 seconds after toggling; the activating notice appears while any market is activating.
- Clicking remove opens an `AlertDialog`; confirming removes the market from `channelMarkets` and `entityDataUpdate.markets`.
- `+ Add` button opens `ChannelAddMarketDialog`; confirming appends new markets (active: true) to `channelMarkets` and `entityDataUpdate.markets`.
- `hasUnsavedChanges` is `true` after any toggle, remove, or add.
- When no additional markets exist, an empty state message is shown.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that toggling active updates `channelMarkets` correctly; test that removing a market filters it from both `channelMarkets` and `entityDataUpdate.markets`; test that adding markets via the dialog appends them as `active: true`; test that the default market (index 0) has no remove button.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Multi-part feature (table + inline toggle with UX guardrails + remove dialog + add integration) that follows established patterns; sonnet can execute this autonomously.
