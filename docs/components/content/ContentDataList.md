# `ContentDataList`

Renders a labeled separator followed by a key/value list, with support for plain text, copy-to-clipboard, tooltip, and link display types.

## Features

- Each `DataItem` can render as plain text, a copyable badge, a tooltip, or a `NuxtLink`
- External links automatically include `rel="noopener noreferrer"` and a `LucideExternalLink` indicator
- Uses `v-auto-animate` for smooth item additions/removals
- Optional section `label` passed to the `Separator` component

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { DataItem } from '#shared/types'
import { DataItemDisplayType } from '#shared/types'

const items: DataItem[] = [
  { label: 'Order ID', value: 'ORD-123', displayType: DataItemDisplayType.Copy },
  { label: 'Status', value: 'Pending' },
  {
    label: 'Customer',
    value: 'johndoe',
    displayType: DataItemDisplayType.Link,
    href: '/customers/johndoe',
  },
]
</script>

<template>
  <ContentDataList :data-list="items" label="Order Details" />
</template>
```

## Props

### `dataList`

```ts
dataList?: DataItem[]
```

- **Type:** `DataItem[]`
- **Default:** `[]`
- **Description:** Array of data rows to render. Each item describes its label, value, and display behavior.

### `label`

```ts
label?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Section label passed to the `Separator` above the list.

## Type Definitions

```ts
enum DataItemDisplayType {
  Text = 'text',
  Copy = 'copy',
  Link = 'link',
  Array = 'array',
}

interface DataItem {
  label: string
  value: unknown
  displayValue?: string
  displayType?: DataItemDisplayType
  href?: string
  target?: '_blank' | '_self'
  entityName?: string  // used with Array type for pluralization
}
```

## Dependencies

- [`ContentTextCopy`](/components/content/text/ContentTextCopy)
- [`ContentTextTooltip`](/components/content/text/ContentTextTooltip)
- shadcn-vue [`Separator`](/components/shadcn-vue)
