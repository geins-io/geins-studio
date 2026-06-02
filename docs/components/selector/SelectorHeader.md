# `SelectorHeader`

Section header for a selector widget that displays a title, description, and an inline [`SelectorQuickAdd`](/components/selector/SelectorQuickAdd) search input when entities are available.

## Features

- Renders a [`ContentCardHeader`](/components/content/ContentCardHeader) for the title/description block
- Embeds `SelectorQuickAdd` for keyboard-first entity search with image + ID previews
- Forwards `add` and `remove` events from the quick-add input to the parent

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { SelectorSelectionInternal } from '#shared/types'

const selection = ref<SelectorSelectionInternal>({ ids: [] })
const products = ref([])

const onAdd = (id: string) => selection.value.ids?.push(id)
const onRemove = (id: string) => {
  selection.value.ids = selection.value.ids?.filter(i => i !== id)
}
</script>

<template>
  <SelectorHeader
    title="Select Products"
    description="Choose products to include in this rule"
    :selection="selection"
    :entities="products"
    entity-name="product"
    @add="onAdd"
    @remove="onRemove"
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
- **Description:** Heading text rendered by `ContentCardHeader`.

### `description`

```ts
description: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Sub-heading text rendered by `ContentCardHeader`.

### `selection`

```ts
selection: SelectorSelectionInternal
```

- **Type:** `SelectorSelectionInternal`
- **Required:** yes
- **Description:** The current selection state; used to derive `selectedIds` for the quick-add input.

### `entities`

```ts
entities: T[]
```

- **Type:** `T[]` where `T extends SelectorEntity`
- **Required:** yes
- **Description:** Entity pool forwarded to `SelectorQuickAdd`. If the array is empty the quick-add input is hidden.

### `entityName`

```ts
entityName: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Singular entity name passed to `SelectorQuickAdd` for placeholder text.

## Events

### `add`

```ts
(e: 'add', id: string): void
```

Emitted when the user selects an entity from the quick-add dropdown.

### `remove`

```ts
(e: 'remove', id: string): void
```

Emitted when the user deselects an already-selected entity in the quick-add dropdown.

## Dependencies

- [`ContentCardHeader`](/components/content/ContentCardHeader)
- [`SelectorQuickAdd`](/components/selector/SelectorQuickAdd)
