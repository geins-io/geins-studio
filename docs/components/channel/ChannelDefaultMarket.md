# `ChannelDefaultMarket`

`ChannelDefaultMarket` is the section inside a channel's edit page that displays the default market as a single-row minimal-mode [`TableView`](/components/table/TableView), with a Change button that emits a `change` event the parent handles by opening a market picker.

## Features

- Single-row table — same column layout (`flag` + `status`) as [`ChannelAdditionalMarkets`](/components/channel/ChannelAdditionalMarkets) for visual parity
- Change button is gated on `canChange` — used to lock the default while the parent's market list is dirty
- Empty state when no default is set yet

## Usage

```vue
<template>
  <ChannelDefaultMarket
    :default-market="defaultMarket"
    :can-change="!hasUnsavedChanges"
    @change="openChangeDefaultMarket"
  />
</template>
```

## Props

### `defaultMarket`

```ts
defaultMarket: ChannelMarket | undefined
```

The market currently set as default. `undefined` shows the empty state.

### `canChange`

```ts
canChange: boolean
```

Enables the Change button.

## Events

### `change`

Emitted when the user clicks Change. Parent owns the picker UI.

## Dependencies

- shadcn-vue `Item` family, `Button`
- [`TableView`](/components/table/TableView), [`useColumns`](/composables/useColumns), `useMarketTable`
