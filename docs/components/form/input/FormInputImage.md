# `FormInputImage`

`FormInputImage` is the image upload field — a clickable card that accepts both file picker and drag-and-drop, with built-in size + MIME validation, preview, and replace flow.

## Features

- Click or drag-drop to upload
- MIME-type allowlist via `accept` (defaults to `image/*`)
- Configurable size limit via `maxSizeMB`
- Inline error states for invalid type / oversize, localized via `image_upload_*` keys
- Local preview using `URL.createObjectURL` (cleaned up on replace + unmount)
- Falls back to remote preview when `modelValue` is a URL string
- Strips the `storefrontSettings.` filename prefix the API adds
- Calls [`useGeinsImage().handleImageError`](/composables/useGeinsImage) on broken remote images

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const logo = ref<File | string | null>(null);
</script>

<template>
  <FormInputImage
    v-model="logo"
    accept="image/png,image/jpeg,image/svg+xml"
    :max-size-m-b="2"
    label="Logo"
    description="PNG, JPG, or SVG up to 2MB."
  />
</template>
```

## Props

### `modelValue`

```ts
modelValue?: string | File | null
```

The current image. Pass a URL string to display an existing remote image, a `File` for a freshly picked one, or `null` for empty.

### `disabled`

```ts
disabled?: boolean
```

Disables click and drag/drop interactions.

### `accept`

```ts
accept?: string
```

MIME-type allowlist (e.g. `'image/png,image/jpeg'`). Defaults to `'image/*'`.

### `maxSizeMB`

```ts
maxSizeMB?: number
```

Maximum file size in megabytes. Files over the limit show a localized error and are not emitted.

### `description`

```ts
description?: string
```

Helper text rendered below the title in the empty state.

### `label`

```ts
label?: string
```

Used as the image `alt` text.

## Events

### `update:modelValue`

```ts
(value: File | null): void
```

Emitted with the new `File` when the user picks/drops one, or `null` when cleared.

## Dependencies

- shadcn-vue `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`
- [`useGeinsImage`](/composables/useGeinsImage) for fallback/error handling on remote previews
