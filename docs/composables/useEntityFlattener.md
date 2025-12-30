# `useEntityFlattener`

The `useEntityFlattener` composable provides utilities for flattening nested entity relationships into flat arrays suitable for table display with grouping. It's commonly used when displaying child entities (e.g., SKUs) that need to maintain a reference to their parent entity (e.g., Product).

## Features

- **Flatten parent-child relationships** - Extract child entities while preserving parent context
- **Configurable parent field copying** - Choose which parent fields to include
- **Type-safe** - Full TypeScript support with generics
- **Grouping utilities** - Helper functions for organizing flattened data

## Usage

### Basic SKU Flattening

```ts
const { flattenChildren } = useEntityFlattener();

// Flatten products into SKUs with parent context
const skuEntities = computed(() =>
  flattenChildren(products.value, 'skus', ['productId', 'name', 'thumbnail']),
);

// Result: Each SKU has parent_productId, parent_name, parent_thumbnail
```

### Using with Selector Component

```vue
<script setup lang="ts">
const { flattenChildren } = useEntityFlattener();

// Original products with SKUs
const products = ref<Product[]>([...]);

// Flatten for SKU selection
const skuEntities = computed(() =>
  flattenChildren(
    products.value,
    'skus',
    ['productId', 'name', 'thumbnail']
  )
);
</script>

<template>
  <Selector
    :entities="skuEntities"
    entity-name="sku"
    :mode="SelectorMode.Simple"
    :table-grouping="{
      groupBy: ['parent_productId'],
      enableExpanding: true,
      defaultExpanded: false,
    }"
    v-model:simple-selection="selectedSkuIds"
  />
</template>
```

### Grouping Flattened Data

```ts
const { flattenChildren, groupBy } = useEntityFlattener();

// Flatten SKUs
const flatSkus = flattenChildren(products.value, 'skus', ['productId', 'name']);

// Group by product
const groupedByProduct = groupBy(flatSkus, 'parent_productId');

// Access grouped data
groupedByProduct.forEach((skus, productId) => {
  console.log(`Product ${productId} has ${skus.length} SKUs`);
});
```

## API Reference

### `flattenChildren<TParent, TChild>`

Flattens child entities from parent entities while preserving parent context.

**Parameters:**

- `parents: TParent[]` - Array of parent entities containing children
- `childKey: keyof TParent` - Property name on parent that contains child array
- `parentFields?: (keyof TParent)[]` - Optional array of parent fields to copy to each child (prefixed with 'parent\_')

**Returns:** `(TChild & Record<string, any>)[]` - Flattened array of child entities with parent context

**Example:**

```ts
const flattened = flattenChildren(products, 'skus', [
  'productId',
  'name',
  'thumbnail',
]);

// Each SKU in result has:
// - All original SKU properties
// - parent_productId
// - parent_name
// - parent_thumbnail
```

### `groupBy<T>`

Groups flat entities by a specified key.

**Parameters:**

- `entities: T[]` - Array of entities to group
- `groupByKey: keyof T` - Key to group entities by

**Returns:** `Map<any, T[]>` - Map of grouped entities with key as group identifier

**Example:**

```ts
const grouped = groupBy(skuEntities, 'parent_productId');

// Result is a Map:
// Map {
//   '123' => [sku1, sku2, sku3],
//   '456' => [sku4, sku5]
// }
```

## Type Definitions

```ts
function useEntityFlattener(): {
  flattenChildren: <TParent, TChild>(
    parents: TParent[],
    childKey: keyof TParent,
    parentFields?: (keyof TParent)[],
  ) => (TChild & Record<string, any>)[];

  groupBy: <T>(entities: T[], groupByKey: keyof T) => Map<any, T[]>;
};
```

## Common Use Cases

### 1. SKU Selection from Products

```ts
const skuSelection = computed(() =>
  flattenChildren(products.value, 'skus', ['productId', 'name']),
);
```

### 2. Variant Selection

```ts
const variantSelection = computed(() =>
  flattenChildren(products.value, 'variants', ['productId', 'sku']),
);
```

### 3. Any Nested Structure

```ts
// Orders → Line Items
const lineItems = flattenChildren(orders.value, 'lineItems', [
  'orderId',
  'customerName',
]);

// Categories → Subcategories
const allCategories = flattenChildren(categories.value, 'children', [
  'parentId',
  'level',
]);
```

## Notes

- Parent fields are always prefixed with `parent_` to avoid naming collisions
- The original child properties are preserved
- Works with any nested array structure
- Type-safe with full TypeScript inference
- Handles empty arrays gracefully (returns empty array)

## Related

- [useSelector](/composables/useSelector) - Managing product selector state
- [TableView](/components/table-view) - Table component with grouping support
- [Selector](/components/selector) - Selection component
