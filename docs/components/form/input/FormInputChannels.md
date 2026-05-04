# `FormInputChannels`

`FormInputChannels` is the standard channel picker — a thin wrapper around [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) bound to the channels exposed by `useAccountStore`.

## Features

- Auto-binds to `accountStore.channels` — no dataset prop needed
- Renders selected channels as chips
- Inherits all behaviour from [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) (search, multi-select, portaled dropdown)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const channelIds = ref<string[]>([]);
</script>

<template>
  <FormInputChannels v-model="channelIds" />
</template>
```

## Props

### `placeholder`

```ts
placeholder?: string
```

Override the default "Add channel…" placeholder.

- **Default:** `''`

## v-model

### default

```ts
v-model: string[]
```

Array of selected channel ids.

## Dependencies

- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) — base picker
- `useAccountStore` — source of `channels`
