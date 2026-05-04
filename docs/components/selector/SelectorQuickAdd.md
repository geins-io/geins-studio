# `SelectorQuickAdd`

Keyboard-first search input for quickly adding or removing entities from a selection without opening the full panel. Displays a command-palette-style dropdown with optional thumbnails and IDs.

## Features

- Generic over any type extending `SelectorEntity`
- Popover closes automatically on outside click (uses `v-click-outside`)
- Already-selected entities show a checkmark; unselected entities show a "+" icon
- Optional thumbnail image and numeric ID display
- Graceful image fallback via `useGeinsImage`

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const products = ref([/* SelectorEntity[] */])
const selectedIds = ref<string[]>([])

const onAdd = (id: string) => selectedIds.value.push(id)
const onRemove = (id: string) => {
  selectedIds.value = selectedIds.value.filter(i => i !== id)
}
</script>

<template>
  <SelectorQuickAdd
    :entities="products"
    :selection="selectedIds"
    entity-name="product"
    :show-image="true"
    :show-id="true"
    @add="onAdd"
    @remove="onRemove"
  />
</template>
```

## Props

### `entities`

```ts
entities: T[]
```

- **Type:** `T[]` where `T extends SelectorEntity`
- **Required:** yes
- **Description:** Full entity pool to search through.

### `selection`

```ts
selection: string[]
```

- **Type:** `string[]`
- **Required:** yes
- **Description:** Array of currently selected entity `_id` values. Used to render the checkmark state.

### `entityName`

```ts
entityName: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Singular entity name used in the input placeholder and empty state text.

### `showImage`

```ts
showImage?: boolean
```

- **Type:** `boolean`
- **Default:** `undefined` (falsy)
- **Description:** When `true`, renders the entity's `image` or `thumbnail` as a small avatar in each result row.

### `showId`

```ts
showId?: boolean
```

- **Type:** `boolean`
- **Default:** `undefined` (falsy)
- **Description:** When `true`, renders the entity `_id` in bold before the name.

## Events

### `add`

```ts
(e: 'add', id: string): void
```

Emitted when the user clicks an unselected entity row.

### `remove`

```ts
(e: 'remove', id: string): void
```

Emitted when the user clicks an already-selected entity row.

## Dependencies

- shadcn-vue [`Command`](/components/shadcn-vue), [`Popover`](/components/shadcn-vue) — dropdown shell
