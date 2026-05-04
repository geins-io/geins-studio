# `FormInputRadioCards`

`FormInputRadioCards` renders a 2-column grid of card-style radio buttons — used in schema editors and settings flows where each option needs an icon (or color swatch), title, and description rather than a plain radio.

## Features

- 2-column grid; each option is a clickable card
- Selected card highlights with the positive border + tinted background
- Color options (`option.type === 'color'`) render a color swatch instead of an icon
- Renders title + description through `ContentCardHeader` (documented in a later phase)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { SchemaFieldOption } from '#shared/types';

const layout = ref<string>('grid');
const options: SchemaFieldOption[] = [
  { value: 'grid', label: 'Grid', description: 'Tile cards in a grid', icon: 'LayoutGrid' },
  { value: 'list', label: 'List', description: 'Stack cards vertically', icon: 'List' },
];
</script>

<template>
  <FormInputRadioCards v-model="layout" :options="options" />
</template>
```

## Props

### `options`

```ts
options: SchemaFieldOption[]
```

Cards to render. Each option drives the card's title, description, icon, and (for `type === 'color'`) the color swatch.

### `modelValue`

```ts
modelValue?: string
```

The selected option `value`.

## Events

### `update:modelValue`

```ts
(value: string): void
```

Emitted with the clicked option's `value`.

## Dependencies

- `ContentCardHeader` — title/description/icon layout (documented in a later phase)
