---
prev: false
---

# Working with Data Tables

All list pages of the Geins Studio consists av filterable, sortable and paginated data tables. The data tables are based on the shadcn-vue [Data Table](https://www.shadcn-vue.com/docs/components/data-table.html) component which in turn is built using [TanStack Table](https://tanstack.com/table/latest).

## Features

- **Sortable columns** - Click column headers to sort data
- **Filterable data** - Global search across searchable fields
- **Pagination** - Navigate large datasets efficiently
- **Selectable rows** - Multi-select with checkbox columns
- **Responsive design** - Adapts to different screen sizes
- **Column visibility** - Show/hide columns as needed
- **Hierarchical data** - Expandable rows for parent-child relationships

## Hierarchical Data (Expanding Rows)

The data tables support hierarchical data structures where parent rows can be expanded to reveal child rows. This is particularly useful for displaying products with SKUs, categories with subcategories, or any nested data structure.

### Key Features

- **Expandable rows** with chevron indicators
- **Smart search** that searches both parent and child rows, automatically expanding parents when children match
- **Selective checkbox display** - show checkboxes only on rows that should be selectable
- **Collapsed single-child rows** - automatically collapse parent rows with a single child for cleaner display

### Example: Products with SKUs

```vue
<script setup lang="ts">
import type { Product } from '#shared/types';

const { getColumns, addExpandingColumn } = useColumns<Product>();

// Structure data with SKUs as children
const productsWithSkus = computed(() =>
  products.value.map((product) => ({
    ...product,
    skus: product.skus?.map((sku) => ({
      ...sku,
      productId: product._id,
    })),
  })),
);

let columns = getColumns(productsWithSkus.value);
columns = addExpandingColumn(columns);
</script>

<template>
  <TableView
    :columns="columns"
    :data="productsWithSkus"
    :enable-expanding="true"
    :get-sub-rows="(row) => row.skus"
    :searchable-fields="['_id', 'name', 'articleNumber', 'productId']"
  />
</template>
```

### TableView Props for Hierarchical Data

- `enableExpanding` (boolean): Enable row expansion functionality
- `getSubRows` (function): Function that returns child rows for a given row
- `searchableFields` (array): Fields to search in both parent and child rows

:::tip Search Behavior
When searching hierarchical data, parent rows are automatically expanded if any of their child rows match the search criteria. This ensures users can find nested data easily.
:::
