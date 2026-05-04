# `FormInputColor`

`FormInputColor` is a hex color picker — a clickable color swatch (which opens the native OS color picker) plus a free-text hex input that stays in sync.

## Features

- Native `<input type="color">` picker triggered by clicking the swatch
- Free-text hex input for typing values directly
- Defaults to `#000000` for display when no value is set
- Plain `update:modelValue` emit (not `defineModel`) — pair with `v-model="..."` as usual

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
label: string
```

Used for the swatch's `aria-label` ("Pick {label} color"). Required.

## Events

### `update:modelValue`

```ts
(value: string): void
```

Emitted on both swatch picker change and text input change.
