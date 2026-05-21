# `Selector`

Full-featured entity selection widget that supports selecting products, SKUs, or custom entities — with both advanced (categories + brands + manual IDs) and simple (manual IDs only) modes.

## Features

- Generic over any type extending `SelectorEntity`
- Two modes: `SelectorMode.Advanced` (categories, brands, IDs) and `SelectorMode.Simple` (IDs only)
- Supports v-model for both `SelectorSelectionQueryBase` and `SelectorSelectionSimpleBase`
- Optional exclusion panel (`allowExclusions`) for exclude-from-all scenarios
- Fetches products internally or accepts externally-supplied `entities`
- Configurable column order, product query params, and currency display

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { SelectorSelectionQueryBase } from '#shared/types'
import { SelectorMode, SelectorSelectionStrategy } from '#shared/types'

const selection = ref<SelectorSelectionQueryBase>({ ids: [], condition: 'and' })
</script>

<template>
  <Selector
    v-model:selection="selection"
    entity-name="product"
    :mode="SelectorMode.Advanced"
  />
</template>
```

### Simple mode (IDs only)

```vue
<script setup lang="ts">
import type { SelectorSelectionSimpleBase } from '#shared/types'
import { SelectorMode, SelectorSelectionStrategy } from '#shared/types'

const selection = ref<SelectorSelectionSimpleBase>({ ids: [] })
</script>

<template>
  <Selector
    v-model:simple-selection="selection"
    entity-name="product"
    :mode="SelectorMode.Simple"
    :allow-exclusions="false"
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
- **Description:** The pool of selectable entities to display in the panel table.

### `entityName`

```ts
entityName?: string
```

- **Type:** `string`
- **Default:** `'product'`
- **Description:** Singular entity name used in labels and i18n strings.

### `mode`

```ts
mode?: SelectorMode
```

- **Type:** `SelectorMode`
- **Default:** `SelectorMode.Advanced`
- **Description:** `Advanced` shows category/brand/ID tabs; `Simple` shows IDs only.

### `selectionStrategy`

```ts
selectionStrategy?: SelectorSelectionStrategy
```

- **Type:** `SelectorSelectionStrategy`
- **Default:** `SelectorSelectionStrategy.All`
- **Description:** Controls whether empty selections mean "all entities" or "none".

### `allowExclusions`

```ts
allowExclusions?: boolean
```

- **Type:** `boolean`
- **Default:** `true`
- **Description:** When `true`, an exclude panel is rendered alongside the include panel.

### `productQueryParams`

```ts
productQueryParams?: Record<string, string>
```

- **Type:** `Record<string, string>`
- **Default:** `{ fields: 'localizations,media,prices' }`
- **Description:** Query parameters forwarded to the product list API when fetching internally.

### `currency`

```ts
currency?: string
```

- **Type:** `string`
- **Description:** ISO currency code (e.g. `'SEK'`) used for price-based condition display.

### `fetchEntitiesExternally`

```ts
fetchEntitiesExternally?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, the component does not fetch entities itself — the parent supplies them via `entities`.

### `columnsOrder`

```ts
columnsOrder?: (keyof T)[]
```

- **Type:** `(keyof T)[]`
- **Default:** `['_id', 'name', 'price']`
- **Description:** Column display order for the entity table inside the panel.

## Model

### `selection`

```ts
v-model:selection="value"  // SelectorSelectionQueryBase
```

Two-way bound selection in advanced query format (includes `categoryIds`, `brandIds`, `condition`).

### `simple-selection`

```ts
v-model:simple-selection="value"  // SelectorSelectionSimpleBase
```

Two-way bound selection in simple format (IDs array only). Use with `SelectorMode.Simple`.

## Type Definitions

```ts
interface SelectorEntity {
  _id: string
  name: string
  thumbnail?: string
  image?: string
  articleNumber?: string
  productId?: string | number
  skus?: SelectorEntity[]
}

interface SelectorSelectionQueryBase {
  ids?: string[]
  categoryIds?: string[]
  brandIds?: string[]
  condition?: 'and' | 'or'
}

interface SelectorSelectionSimpleBase {
  ids?: string[]
}

enum SelectorMode {
  Simple = 'simple',
  Advanced = 'advanced',
}

enum SelectorSelectionStrategy {
  All = 'all',
  None = 'none',
}
```

## Dependencies

- [`SelectorSelection`](/components/selector/SelectorSelection) — include/exclude panels
- [`SelectorPanel`](/components/selector/SelectorPanel) — browse sheet
- shadcn-vue [`Sheet`](/components/shadcn-vue) — slide-over panel primitive
