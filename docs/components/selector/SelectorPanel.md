# `SelectorPanel`

A slide-over sheet that lets the user browse and select entities by ID, category, or brand. Used internally by [`SelectorSelection`](/components/selector/SelectorSelection) as the browse trigger.

## Features

- Generic over any type extending `SelectorEntity`
- Three browseable groups: entity IDs, category IDs, brand IDs (shown based on `mode`)
- Left-side nav switches active group; right-side shows live selected entities list
- Confirms selection with a "Save" button and reverts with "Cancel"
- Responsive: selected list collapses to a bottom drawer on mobile

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { SelectorSelectionInternal, SelectorSelectionOption } from '#shared/types'
import { SelectorMode, SelectorEntityType } from '#shared/types'

const selection = ref<SelectorSelectionInternal>({ ids: [] })
const products = ref([/* ... */])

const options: SelectorSelectionOption[] = [
  { id: 'product', group: 'ids', label: 'Products' },
]

const onSave = (updated: SelectorSelectionInternal) => {
  selection.value = updated
}
</script>

<template>
  <SelectorPanel
    :selection="selection"
    :mode="SelectorMode.Advanced"
    :options="options"
    entity-name="product"
    :entities="products"
    @save="onSave"
  >
    <!-- trigger element -->
    <Button>Browse</Button>
  </SelectorPanel>
</template>
```

## Props

### `selection`

```ts
selection: SelectorSelectionInternal
```

- **Type:** `SelectorSelectionInternal`
- **Required:** yes
- **Description:** Current selection passed in; the panel keeps an internal copy and only applies it on "Save".

### `mode`

```ts
mode: SelectorMode
```

- **Type:** `SelectorMode`
- **Required:** yes
- **Description:** Determines which tabs/groups are visible in the panel.

### `currency`

```ts
currency?: string
```

- **Type:** `string`
- **Description:** ISO currency code forwarded for future price-based selection.

### `options`

```ts
options: SelectorSelectionOption[]
```

- **Type:** `SelectorSelectionOption[]`
- **Required:** yes
- **Description:** Array of navigation tabs. Each item maps an `id` to a `group` key in `SelectorSelectionInternal`.

### `entityName`

```ts
entityName: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Singular entity name used in the sheet title and table labels.

### `entities`

```ts
entities: T[]
```

- **Type:** `T[]` where `T extends SelectorEntity`
- **Required:** yes
- **Description:** Full entity pool displayed in the table.

### `entityType`

```ts
entityType?: SelectorEntityType
```

- **Type:** `SelectorEntityType`
- **Default:** `SelectorEntityType.Product`
- **Description:** Switches column layout and sub-row expansion for SKU-type entities.

## Events

### `save`

```ts
(event: 'save', selection: SelectorSelectionInternal): void
```

Emitted when the user confirms the selection. Parent should replace its selection ref with the emitted value.

## Slots

### default

The trigger element that opens the sheet (wrapped in `SheetTrigger as-child`). Typically a `<Button>`.

## Type Definitions

```ts
interface SelectorSelectionOption {
  id: SelectorSelectionOptionsId
  group: string
  label: string
}

enum SelectorEntityType {
  Product = 'product',
  Sku = 'sku',
}
```

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue) — slide-over container
- [`TableView`](/components/table/TableView) — entity browsing table
- [`SelectorQuickAdd`](/components/selector/SelectorQuickAdd) — omitted here; lives in `SelectorHeader`
