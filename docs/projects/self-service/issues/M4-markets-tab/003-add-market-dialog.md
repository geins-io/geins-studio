---
title: 'Implement ChannelAddMarketDialog for assigning markets to a channel'
project: 'Self Service (Channels)'
milestone: 'M4 — Markets Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './002-default-market-section.md'
  - '../M3-general-tab/003-form-input-tags-search-scoped-slots.md'
  - '../M1-foundation/002-channel-api-repository.md'
model: sonnet
mode: claude-code agent
---

## Context

The additional markets section has a "+ Add" button that opens a dialog for selecting one or more unassigned markets to attach to the channel. Available markets come from `ListAllMarkets` (`GET /account/market/list`), filtered to exclude those already assigned. This follows the same pattern as the add language dialog in M3/005, reusing the `FormInputTagsSearch` component with the scoped-slot flag rendering added in M3/003.

## Expected Outcome

A `ChannelAddMarketDialog` component (`app/components/channel/ChannelAddMarketDialog.vue`) that:
1. Opens a `Dialog` with `FormInputTagsSearch` showing all unassigned system markets.
2. Dropdown items and tag pills render a country flag emoji + country name via `#item` and `#tag` scoped slots.
3. On confirm, emits `add` with the selected markets as `ChannelMarketAssignment[]` (all `active: true`).
4. On cancel or dismiss, closes without emitting.
5. Resets selection on close.

## Implementation Notes

### Props and emits

```ts
defineProps<{
  open: boolean
  allMarkets: ChannelMarket[]       // all system markets, pre-fetched by parent
  assignedMarketIds: string[]       // filter: exclude these from options
}>()

defineEmits<{
  'update:open': [value: boolean]
  add: [markets: ChannelMarketAssignment[]]
}>()
```

Prefer receiving `allMarkets` as a prop (fetched once in the parent `[id].vue` via `useAsyncData`) to avoid duplicate API calls on every dialog open.

### Mapping markets to `EntityBaseWithName[]`

`FormInputTagsSearch` accepts `EntityBaseWithName[]` (items with `_id` and `name`). Map:

```ts
const marketOptions = computed(() =>
  props.allMarkets
    .filter(m => !props.assignedMarketIds.includes(m._id))
    .map(m => ({ _id: m._id, name: m.country.name }))
)
```

### Flag rendering via scoped slots

Use the `#item` and `#tag` scoped slots (added to `FormInputTagsSearch` in M3/003):

```html
<FormInputTagsSearch :dataSet="marketOptions" v-model="selectedIds" :disableTeleport="true">
  <template #item="{ item }">
    {{ countryCodeToFlagEmoji(getCountryCode(item._id)) }} {{ item.name }}
  </template>
  <template #tag="{ item }">
    {{ countryCodeToFlagEmoji(getCountryCode(item._id)) }} {{ item.name }}
  </template>
</FormInputTagsSearch>
```

Add a local computed `marketCountryCodeMap: ComputedRef<Map<string, string>>` built from `allMarkets` for O(1) country code lookup by market `_id`. The helper `getCountryCode(id)` reads from this map.

### On confirm

- Map `selectedIds` to `ChannelMarketAssignment[]`: `selectedIds.value.map(id => ({ _id: id, active: true }))`.
- Emit `add` with the result.
- Reset `selectedIds` to `[]` and emit `update:open` with `false`.

### `disableTeleport`

Pass `:disableTeleport="true"` to `FormInputTagsSearch` — it is inside a `Dialog`.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.add_market` (dialog title + button label)
- `channel.select_markets_placeholder`
- `channel.no_markets_available` (when all markets are already assigned)

## Acceptance Criteria

- Dialog opens when `:open="true"` and shows unassigned system markets in `FormInputTagsSearch`.
- Already-assigned markets (from `assignedMarketIds`) are excluded from the options.
- Dropdown items and tag pills show flag emoji + country name via scoped slots.
- When all available markets are already assigned, an empty state or message is shown.
- Confirming emits `add` with a `ChannelMarketAssignment[]` where all entries have `active: true`.
- Cancelling or dismissing closes the dialog without emitting `add`.
- Selection resets after confirm or cancel.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that assigned markets are excluded from the computed options; test that confirming emits the correct `ChannelMarketAssignment[]` shape; test that selection resets after confirm.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: New component following the established add-dialog pattern from M3/005 — involves data mapping and scoped-slot wiring but no novel patterns.
