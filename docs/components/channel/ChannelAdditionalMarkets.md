# `ChannelAdditionalMarkets`

`ChannelAdditionalMarkets` is the section inside a channel's edit page that manages every market **except** the default — heading + Add button, a minimal-mode [`TableView`](/components/table/TableView) with active toggles + delete actions, and the supporting [`ChannelAddMarketDialog`](/components/channel/ChannelAddMarketDialog) and remove confirmation.

## Features

- Filters the default market out of the table
- Inline active toggle per row → emits `update`
- Per-row delete opens an `AlertDialog`; confirm emits `remove`
- Add flow delegated to [`ChannelAddMarketDialog`](/components/channel/ChannelAddMarketDialog)
- `disabled` prop disables every toggle, the Add button, and every delete (used in read-only contexts)
- Country flag column via [`useColumns`](/composables/useColumns) `flag` column type
- Empty state with a `Globe` icon

## Usage

```vue
<template>
  <ChannelAdditionalMarkets
    :all-markets="allMarkets"
    :channel-markets="channel.markets"
    :default-market-id="channel.defaultMarket"
    @add="(markets) => addMarkets(markets)"
    @update="(market) => updateMarket(market)"
    @remove="(id) => removeMarket(id)"
  />
</template>
```

## Props

### `allMarkets`

```ts
allMarkets: Market[]
```

### `channelMarkets`

```ts
channelMarkets: ChannelMarket[]
```

Markets currently on the channel.

### `defaultMarketId`

```ts
defaultMarketId: string
```

Used to filter the default out of the table.

### `disabled`

```ts
disabled?: boolean
```

Disables every interaction (active toggles, delete, Add).

- **Default:** `false`

## Events

### `add`

```ts
(markets: ChannelMarketAssignment[]): void
```

### `update`

```ts
(market: ChannelMarketAssignment): void
```

### `remove`

```ts
(marketId: string): void
```

## Dependencies

- shadcn-vue `Item` family, `Button`, [`AlertDialog`](/components/shadcn-vue)
- [`TableView`](/components/table/TableView), [`useColumns`](/composables/useColumns), `useMarketTable`
- [`ChannelAddMarketDialog`](/components/channel/ChannelAddMarketDialog)
