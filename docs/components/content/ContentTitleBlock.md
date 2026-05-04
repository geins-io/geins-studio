# `ContentTitleBlock`

The default title + description block for page-level headers. Optionally shows a pulsing orange dot when there are unsaved changes.

## Features

- Renders an `<h1>` for the title and a muted paragraph for the description
- Unsaved-changes indicator: animated orange pulsing dot when `unsavedChanges` is `true`
- Used as the default content inside [`ContentHeader`](/components/content/ContentHeader)

## Usage

### Basic Usage

```vue
<template>
  <ContentTitleBlock title="Order #1234" description="View and edit this order" />
</template>
```

### With unsaved-changes indicator

```vue
<script setup lang="ts">
const { hasUnsavedChanges } = useEntityEdit(/* ... */)
</script>

<template>
  <ContentTitleBlock
    title="Edit Product"
    :unsaved-changes="hasUnsavedChanges"
  />
</template>
```

## Props

### `title`

```ts
title: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** The page or entity title rendered as an `<h1>`.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Description:** Secondary muted text shown below the title.

### `unsavedChanges`

```ts
unsavedChanges?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, renders a pulsing orange dot next to the title to signal pending changes.

## Dependencies

- [`ContentHeader`](/components/content/ContentHeader) — typical parent
