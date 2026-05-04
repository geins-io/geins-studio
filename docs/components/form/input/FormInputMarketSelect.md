# `FormInputMarketSelect`

`FormInputMarketSelect` is a single-value market picker — a combobox over a `Market[]` dataset that renders a country flag plus the formatted label `"Country (Currency)"`.

## Features

- Per-row flag from the market's country code
- Label format: `"Country name (CUR)"` — e.g. `"Sweden (SEK)"`
- Searchable, portaled dropdown
- `disableTeleport` escape hatch for dialogs/sheets

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { Market } from '#shared/types';

const marketId = ref<string>();
const markets: Market[] = await fetchMarkets();
</script>

<template>
  <FormInputMarketSelect v-model="marketId" :data-set="markets" />
</template>
```

## Props

### `dataSet`

```ts
dataSet?: Market[]
```

Markets to choose from.

- **Default:** `[]`

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline.

- **Default:** `false`

## v-model

### default

```ts
v-model: string
```

Selected market `_id`.

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`
- `flagClass` utility for the country flag background
