# `ChannelAddMarketDialog`

`ChannelAddMarketDialog` is the dialog for picking one or more markets to assign to a channel — a [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) over the list of markets that aren't already assigned, with country-flag chips.

## Features

- Filters out markets already in `assignedMarketIds` so the user can't double-assign
- Renders a country flag next to each market label (both inside the dropdown and on the selected chips)
- Shows a localized empty-state message when every market is already assigned
- Emits `add` with `ChannelMarketAssignment[]` (each entry default-active)
- Two-way `open` via `update:open` (no `defineModel` here — uses prop + event)

## Usage

```vue
<script setup lang="ts">
const open = ref(false);

const onAdd = (assignments: ChannelMarketAssignment[]) => {
  channel.markets.push(...assignments);
};
</script>

<template>
  <ChannelAddMarketDialog
    :open="open"
    :all-markets="allMarkets"
    :assigned-market-ids="channel.markets.map((m) => m._id)"
    @update:open="open = $event"
    @add="onAdd"
  />
</template>
```

## Props

### `open`

```ts
open: boolean
```

Dialog visibility. Pair with `@update:open` for two-way binding.

### `allMarkets`

```ts
allMarkets: Market[]
```

Full set of markets to choose from.

### `assignedMarketIds`

```ts
assignedMarketIds: string[]
```

`_id`s already on the channel — filtered out of the picker.

## Events

### `update:open`

```ts
(value: boolean): void
```

### `add`

```ts
(markets: ChannelMarketAssignment[]): void
```

Emitted on confirm with the new assignments — each `{ _id, active: true }`.

## Dependencies

- shadcn-vue [`Dialog`](/components/shadcn-vue), `Button`
- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) — the picker
- `flagClass` utility for the country flags
