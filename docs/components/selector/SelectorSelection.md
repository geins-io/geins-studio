# `SelectorSelection`

Full selection display panel for a single include-or-exclude axis. Shows the current selection as tag groups (categories, brands, price, stock, IDs) with inline remove buttons and a "Browse" button that opens [`SelectorPanel`](/components/selector/SelectorPanel).

## Features

- Two-way v-model binding for the full `SelectorSelectionInternal` object
- Renders tag rows per selection type with [`SelectorTags`](/components/selector/SelectorTags) + [`SelectorTag`](/components/selector/SelectorTag)
- Linking words between groups (e.g. "and also", "or also") via [`SelectorLinkingWord`](/components/selector/SelectorLinkingWord)
- When multiple condition types are active, shows an AND/OR `RadioGroup` toggle
- `noSelectionLabel` adapts to `selectionStrategy` (shows "All products" vs "No products")
- Filters nav tabs based on `mode` (Simple hides category/brand)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { SelectorSelectionInternal } from '#shared/types'
import { SelectorMode, SelectorSelectionType, SelectorSelectionStrategy } from '#shared/types'

const selection = defineModel<SelectorSelectionInternal>('selection', {
  required: true,
})
</script>

<template>
  <SelectorSelection
    v-model:selection="selection"
    :type="SelectorSelectionType.Include"
    :mode="SelectorMode.Advanced"
    entity-name="product"
    :entities="products"
  />
</template>
```

## Props

### `currency`

```ts
currency?: string
```

- **Type:** `string`
- **Description:** ISO currency code shown in price condition tags.

### `type`

```ts
type: SelectorSelectionType
```

- **Type:** `SelectorSelectionType`
- **Required:** yes
- **Description:** `Include` or `Exclude` — controls the section heading label.

### `entityName`

```ts
entityName: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Singular entity name used in labels and empty-state text.

### `mode`

```ts
mode: SelectorMode
```

- **Type:** `SelectorMode`
- **Required:** yes
- **Description:** Forwarded to `SelectorPanel` to control visible tabs.

### `entities`

```ts
entities: SelectorEntity[]
```

- **Type:** `SelectorEntity[]`
- **Required:** yes
- **Description:** Entity pool forwarded to `SelectorPanel`.

### `selectionStrategy`

```ts
selectionStrategy?: SelectorSelectionStrategy
```

- **Type:** `SelectorSelectionStrategy`
- **Description:** Affects the "no selection" label — `All` shows "All products", `None` shows "No products".

## Model

### `selection`

```ts
v-model:selection="value"  // SelectorSelectionInternal
```

The full internal selection object including `ids`, `categoryIds`, `brandIds`, `price`, `stock`, and `condition`.

## Type Definitions

```ts
enum SelectorSelectionType {
  Include = 'include',
  Exclude = 'exclude',
}

enum SelectorMode {
  Simple = 'simple',
  Advanced = 'advanced',
}
```

## Dependencies

- [`SelectorPanel`](/components/selector/SelectorPanel)
- [`SelectorTags`](/components/selector/SelectorTags)
- [`SelectorTag`](/components/selector/SelectorTag)
- [`SelectorTagLink`](/components/selector/SelectorTagLink)
- [`SelectorLinkingWord`](/components/selector/SelectorLinkingWord)
- [`ContentHeading`](/components/content/ContentHeading)
- shadcn-vue [`RadioGroup`](/components/shadcn-vue)

## Example

Typical usage inside a price-list or promotion entity edit page where include and exclude panels appear side by side:

```vue
<template>
  <SelectorSelection
    v-model:selection="inclusion"
    :type="SelectorSelectionType.Include"
    :mode="SelectorMode.Advanced"
    entity-name="product"
    :entities="products"
    :selection-strategy="SelectorSelectionStrategy.All"
  />
  <SelectorSelection
    v-model:selection="exclusion"
    :type="SelectorSelectionType.Exclude"
    :mode="SelectorMode.Advanced"
    entity-name="product"
    :entities="products"
  />
</template>
```
