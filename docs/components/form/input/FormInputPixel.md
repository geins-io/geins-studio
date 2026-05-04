# `FormInputPixel`

`FormInputPixel` is a numeric input that always emits a CSS pixel value (`"24px"`) and displays the current value with a trailing `px` suffix. Strips non-digits as the user types.

## Features

- Strips non-numeric characters on input
- Stores `"24px"` in the model, displays `24` in the field
- Emits empty string when cleared
- `inputmode="numeric"` for mobile keyboards

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const fontSize = ref<string>('16px');
</script>

<template>
  <FormInputPixel v-model="fontSize" placeholder="16px" />
</template>
```

## Props

### `modelValue`

```ts
modelValue?: string | null
```

CSS pixel string (e.g. `'24px'`). Anything ending in `px` is accepted; the suffix is stripped for display.

### `placeholder`

```ts
placeholder?: string
```

Placeholder shown when empty. Trailing `px` is stripped automatically for display parity.

## Events

### `update:modelValue`

```ts
(value: string): void
```

Emits `'24px'` for non-empty values, `''` when cleared.
