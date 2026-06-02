# `FormInputColor`

`FormInputColor` is a hex color picker — a clickable color swatch (which opens the native OS color picker) plus a free-text hex input that stays in sync.

## Features

- Native `<input type="color">` picker triggered by clicking the swatch
- Free-text hex input for typing values directly
- Defaults to `#000000` for display when no value is set
- Plain `update:modelValue` emit (not `defineModel`) — pair with `v-model="..."` as usual
- Optional `contrastWarning` triggers a trailing warning icon + tooltip (used when a sibling color fails WCAG AA)

## Structure

Composed from the shadcn-vue [`InputGroup`](https://www.shadcn-vue.com/docs/components/input-group.html) primitive:

- Leading `InputGroupAddon`: swatch button + hidden native `<input type="color">` (the swatch triggers the picker via `.click()`)
- `InputGroupInput`: the hex text input
- Trailing `InputGroupAddon` (conditional on `contrastWarning`): warning icon with tooltip

Focus/disabled/aria-invalid styling comes from `InputGroup` — no hand-rolled `focus-within` shell.

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const brandColor = ref<string>('#FF6A00');
</script>

<template>
  <FormInputColor v-model="brandColor" label="Brand color" />
</template>
```

## Props

### `modelValue`

```ts
modelValue?: string
```

The current hex color (e.g. `'#FF6A00'`). Empty/undefined renders as `#000000`.

### `label`

```ts
label: string;
```

Used for the swatch's `aria-label` ("Pick {label} color"). Required.

### `contrastWarning`

```ts
contrastWarning?: number | null  // default: null
```

When non-null, renders a trailing warning icon whose tooltip shows the contrast ratio. The value is the failing ratio (e.g. `3.2`); supply `null` to hide the warning. Computed upstream by `getSubSectionContrastWarnings` in `@/utils/storefront`.

## Events

### `update:modelValue`

```ts
(value: string): void
```

Emitted on both swatch picker change and text input change.
