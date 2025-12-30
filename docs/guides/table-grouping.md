# Table Grouping Feature

The TableView component now supports grouping rows by one or more columns using TanStack Table's built-in grouping functionality. This is particularly useful for displaying hierarchical data like products with SKUs, orders with line items, or any parent-child relationship.

## Overview

Table grouping allows you to:

- Group rows by any column(s)
- Expand/collapse grouped rows
- Display aggregated data in group headers
- Show counts and summaries
- Maintain selection state across groups

## Basic Usage

### Simple Grouping

```vue
<script setup lang="ts">
const data = ref([
  { id: 1, productId: 'P1', name: 'SKU-A', stock: 10 },
  { id: 2, productId: 'P1', name: 'SKU-B', stock: 5 },
  { id: 3, productId: 'P2', name: 'SKU-C', stock: 8 },
]);

const columns = [
  { accessorKey: 'productId', header: 'Product' },
  { accessorKey: 'name', header: 'SKU' },
  { accessorKey: 'stock', header: 'Stock' },
];
</script>

<template>
  <TableView
    :data="data"
    :columns="columns"
    :grouping="{
      groupBy: ['productId'],
      enableExpanding: true,
      defaultExpanded: false,
    }"
  />
</template>
```

### With Selector Component (SKU Selection)

```vue
<script setup lang="ts">
import { SelectorMode } from '#shared/types';

const { flattenChildren } = useEntityFlattener();

// Your products with SKUs
const products = ref<Product[]>([...]);

// Flatten SKUs with parent product info
const skuEntities = computed(() =>
  flattenChildren(
    products.value,
    'skus',
    ['productId', 'name', 'thumbnail']
  )
);

// Selected SKU IDs
const selectedSkuIds = ref({
  include: [],
  exclude: [],
});
</script>

<template>
  <Selector
    :entities="skuEntities"
    entity-name="sku"
    :mode="SelectorMode.Simple"
    v-model:simple-selection="selectedSkuIds"
    :table-grouping="{
      groupBy: ['parent_productId'],
      enableExpanding: true,
      defaultExpanded: false,
    }"
    :columns-order="[
      'select',
      'parent_thumbnail',
      'parent_productId',
      '_id',
      'articleNumber',
      'name',
    ]"
  />
</template>
```

## Configuration Options

### `TableGroupingConfig` Interface

```ts
interface TableGroupingConfig {
  groupBy: string[]; // Column IDs to group by
  enableExpanding?: boolean; // Allow expand/collapse (default: true)
  defaultExpanded?: boolean | Record<string, boolean>; // Initial expanded state
}
```

### `groupBy`

Array of column IDs to group by. Can group by multiple columns for nested grouping.

```ts
// Single level grouping
grouping: {
  groupBy: ['productId'];
}

// Multi-level grouping
grouping: {
  groupBy: ['category', 'productId'];
}
```

### `enableExpanding`

Controls whether users can expand/collapse groups. Set to `false` to keep all groups expanded.

```ts
// Allow expanding/collapsing (default)
grouping: {
  groupBy: ['productId'],
  enableExpanding: true
}

// Disable expanding (always show all)
grouping: {
  groupBy: ['productId'],
  enableExpanding: false
}
```

### `defaultExpanded`

Initial state of groups - all expanded, all collapsed, or specific groups.

```ts
// All collapsed (default)
grouping: {
  groupBy: ['productId'],
  defaultExpanded: false
}

// All expanded
grouping: {
  groupBy: ['productId'],
  defaultExpanded: true
}

// Specific groups expanded
grouping: {
  groupBy: ['productId'],
  defaultExpanded: {
    'product-123': true,
    'product-456': true
  }
}
```

## Column Configuration for Grouping

When using grouping, you may want to customize how grouped columns display:

```ts
const columns = [
  {
    id: 'parent_productId',
    accessorKey: 'parent_productId',
    header: 'Product',
    // Custom cell for group header
    cell: ({ row, getValue }) => {
      if (row.getIsGrouped()) {
        // Show custom content in group header
        return `Product: ${row.original.parent_name}`;
      }
      return null; // Hide in regular rows
    },
    // Optional: Aggregation function
    aggregationFn: 'count',
  },
  {
    accessorKey: 'name',
    header: 'SKU Name',
    // Only show in child rows
    cell: ({ row, getValue }) => {
      if (row.getIsGrouped()) return null;
      return getValue();
    },
  },
];
```

## Visual Styling

Grouped rows automatically receive special styling:

- **Group header rows**: `bg-muted/50 font-medium` with darker hover state
- **Expand button**: Animated chevron icon that rotates when expanded
- **Count badge**: Shows number of items in group
- **Indentation**: Visual hierarchy for nested groups

## Complete Example: Product SKU Selection

```vue
<script setup lang="ts">
import { SelectorMode } from '#shared/types';
import type { Product, Sku } from '#shared/types';

// Composables
const { flattenChildren } = useEntityFlattener();

// Load products from API
const { data: products } = await useAsyncData('products', () =>
  $fetch('/api/products?fields=skus,thumbnail,name'),
);

// Flatten products into SKUs with parent info
const skuEntities = computed(() => {
  if (!products.value) return [];

  return flattenChildren<Product, Sku>(products.value, 'skus', [
    'productId',
    'name',
    'thumbnail',
    'articleNumber',
  ]);
});

// Selected SKU IDs
const selectedSkus = ref({
  include: [],
  exclude: [],
});

// Custom columns for SKU display
const skuColumns = computed(() => [
  'select',
  'parent_thumbnail',
  'parent_productId',
  'parent_name',
  '_id',
  'articleNumber',
  'name',
  'stock',
]);

// Watch selections
watch(
  selectedSkus,
  (newSelection) => {
    console.log('Selected SKUs:', newSelection.include);
    console.log('Excluded SKUs:', newSelection.exclude);
  },
  { deep: true },
);
</script>

<template>
  <div>
    <h2>Select SKUs</h2>
    <Selector
      :entities="skuEntities"
      entity-name="sku"
      :mode="SelectorMode.Simple"
      v-model:simple-selection="selectedSkus"
      :columns-order="skuColumns"
      :table-grouping="{
        groupBy: ['parent_productId'],
        enableExpanding: true,
        defaultExpanded: false,
      }"
      :allow-exclusions="true"
    />

    <div v-if="selectedSkus.include.length">
      <h3>Selected: {{ selectedSkus.include.length }} SKUs</h3>
      <pre>{{ selectedSkus.include }}</pre>
    </div>
  </div>
</template>
```

## Aggregation Functions

You can add aggregation functions to columns to show summaries in group headers:

```ts
const columns = [
  {
    accessorKey: 'stock',
    header: 'Stock',
    aggregationFn: 'sum', // Show total stock in group header
  },
  {
    accessorKey: 'price',
    header: 'Price',
    aggregationFn: 'mean', // Show average price in group header
  },
];
```

Available aggregation functions:

- `sum` - Total of all values
- `mean` - Average of all values
- `count` - Number of rows
- `min` - Minimum value
- `max` - Maximum value
- `extent` - [min, max] tuple
- `unique` - Array of unique values
- `uniqueCount` - Count of unique values

## Tips & Best Practices

1. **Parent Field Prefix**: When flattening, parent fields are prefixed with `parent_` to avoid conflicts
2. **Column IDs**: Use the prefixed names in `groupBy` (e.g., `parent_productId`)
3. **Performance**: For large datasets, consider pagination or virtualization
4. **Selection**: Row selection works seamlessly with grouping
5. **Sorting**: Grouped data maintains sort order within groups
6. **Filtering**: Global and column filters work with grouped data

## Related Documentation

- [useEntityFlattener](/composables/useEntityFlattener) - Flatten nested entities
- [useSelector](/composables/useSelector) - Selection state management
- [Selector Component](/components/selector) - Full selector documentation
- [TableView Component](/components/table-view) - Table component details
