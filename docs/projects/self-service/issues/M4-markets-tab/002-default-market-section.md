---
title: 'Implement default market section in the Markets card'
project: 'Self Service (Channels)'
milestone: 'M4 — Markets Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - '../M1-foundation/001-channel-types.md'
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
  - '../M3-general-tab/002-form-input-language-select-with-flags.md'
model: sonnet
mode: claude-code agent
---

## Context

The Markets tab on the channel edit page contains a "Markets" `ContentEditCard`. The top section shows the **default market** — the primary country/currency for the channel. By API convention, the first item in `entityDataUpdate.markets` is the default. This issue also establishes the `ChannelMarket` and `ChannelMarketAssignment` types needed by all M4 issues.

## Expected Outcome

1. `ChannelMarket` and `ChannelMarketAssignment` types defined in `shared/types/Channel.ts`.
2. A labeled "Default market" section inside the Markets `ContentEditCard` showing: Country (flag emoji + name), Currency code, VAT percentage, Group (or `—`), and a Status badge.
3. A "Change" button that opens a `Dialog` listing all currently assigned channel markets as radio options — selecting one and confirming reorders `entityDataUpdate.markets` so the chosen market is at index 0.

## Implementation Notes

### Types

Add to `shared/types/Channel.ts`:

```ts
/** Market as returned in a channel GET response (channel context) */
export interface ChannelMarket {
  _id: string
  _type: string
  country: { _id: string; name: string; code: string }
  currency: { _id: string; code: string }
  vat?: number
  group?: string
  active: boolean
}

/** Shape used in UpdateChannel.markets array */
export interface ChannelMarketAssignment {
  _id: string
  active: boolean
}
```

Align field names with the actual API response — confidence-medium, adjust if needed once BE M3 is available.

### Data flow

- `channelMarkets: Ref<ChannelMarket[]>` is a display ref in `[id].vue`, populated in `parseEntityData` from `entityData.value.markets`.
- `entityDataUpdate.markets: ChannelMarketAssignment[]` is the persistence array. Add a dedicated `watch(channelMarkets, ...)` to sync it (following the non-form ref watcher pattern in `CLAUDE.md`).
- The default market is `channelMarkets.value[0]`.

### Default market display

- Use `countryCodeToFlagEmoji(market.country.code)` (from `app/utils/index.ts`, added in M3/002) for the flag.
- Layout: use the labeled-value section pattern from `CLAUDE.md` — `<p class="text-muted-foreground mb-1 text-xs font-medium">` for labels, `<p class="text-sm">` for values.
- Two-column grid `<div class="grid grid-cols-2 gap-4">` for compact display of Country / Currency, VAT / Group, with a Status badge below.
- If no markets are assigned, render a `—` placeholder.

### Change default market dialog

- `Dialog` triggered by a "Change" button (placed inline in the section, not in `#header-action`).
- Body: `RadioGroup` listing all `channelMarkets.value` entries. Each item shows flag + country name + currency code.
- Currently selected default (index 0) is pre-selected.
- On confirm: reorder `channelMarkets.value` so the selected market moves to index 0; all others shift down.
- The default market cannot be removed from this dialog — only reassigned.
- `hasUnsavedChanges` must be `true` after reordering.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.markets` (card title)
- `channel.default_market`
- `channel.change_default_market` (dialog title / button)
- `channel.no_markets_assigned`
- `channel.market_currency`
- `channel.market_vat`
- `channel.market_group`

## Acceptance Criteria

- `ChannelMarket` and `ChannelMarketAssignment` are exported from `shared/types/Channel.ts`.
- Default market section renders country (flag + name), currency, VAT, group, and status badge for `channelMarkets[0]`.
- "Change" button opens a dialog with a `RadioGroup` listing all assigned markets; current default is pre-selected.
- Confirming with a different market reorders `channelMarkets` so the chosen market is at index 0.
- `entityDataUpdate.markets` stays in sync with `channelMarkets` via a watcher.
- `hasUnsavedChanges` is `true` after changing the default.
- When no markets are assigned, the section shows a `—` placeholder with no errors.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that selecting a new default reorders the `channelMarkets` array; test that `entityDataUpdate.markets` is updated by the watcher; test that `hasUnsavedChanges` is `true` after reorder.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Involves new types, a display section, and a dialog with radio selection — standard feature complexity that sonnet handles autonomously.
