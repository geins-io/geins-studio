# Implementing SKU Selection (GEI-341)

This guide demonstrates how to implement SKU selection functionality using the Selector component with table grouping.

## Overview

The SKU selection feature allows users to:

- Select individual SKUs from products
- View SKUs grouped by their parent product
- Expand/collapse product groups
- See product context (thumbnail, name, ID) alongside SKUs
- Get a simple array of selected SKU IDs

## Implementation Steps

### 1. Import Required Composables and Types

```ts
import { SelectorMode } from '#shared/types';
import type { Product, Sku } from '#shared/types';

const { flattenChildren } = useEntityFlattener();
const { getEmptySimpleSelectionBase } = useSelector();
```

### 2. Fetch Products with SKUs

```ts
// Fetch products from API with SKUs included
const { data: products } = await useAsyncData('products-with-skus', () =>
  productApi.list({ fields: 'skus,thumbnail,name,articleNumber' }),
);
```

### 3. Flatten Products to SKUs

```ts
// Transform products into flat array of SKUs with parent context
const skuEntities = computed(() => {
  if (!products.value) return [];

  return flattenChildren<Product, Sku>(
    products.value,
    'skus', // Child array property name
    ['productId', 'name', 'thumbnail', 'articleNumber'], // Parent fields to copy
  );
});

// Result structure:
// [
//   {
//     ...sku properties (id, articleNumber, stock, etc.),
//     parent_productId: 123,
//     parent_name: "T-Shirt",
//     parent_thumbnail: "/images/tshirt.jpg",
//     parent_articleNumber: "TSH-001"
//   },
//   ...
// ]
```

### 4. Initialize Selection State

```ts
const selectedSkus = ref(getEmptySimpleSelectionBase());

// Result will be:
// {
//   include: ['sku-1', 'sku-2', ...],
//   exclude: ['sku-5', ...]
// }
```

### 5. Configure Selector Component

```vue
<template>
  <Selector
    :entities="skuEntities"
    entity-name="sku"
    :mode="SelectorMode.Simple"
    v-model:simple-selection="selectedSkus"
    :columns-order="[
      'select',
      'parent_thumbnail',
      'parent_name',
      '_id',
      'articleNumber',
      'stock',
    ]"
    :table-grouping="{
      groupBy: ['parent_productId'],
      enableExpanding: true,
      defaultExpanded: false,
    }"
    :allow-exclusions="true"
  />
</template>
```

## Complete Working Example

```vue
<script setup lang="ts">
import { SelectorMode } from '#shared/types';
import type { Product, Sku, SelectorSelectionSimpleBase } from '#shared/types';

// Composables
const { flattenChildren } = useEntityFlattener();
const { getEmptySimpleSelectionBase } = useSelector();
const { productApi } = useGeinsRepository();

// State
const products = ref<Product[]>([]);
const selectedSkus = ref<SelectorSelectionSimpleBase>(
  getEmptySimpleSelectionBase(),
);

// Fetch products with SKUs
const fetchProducts = async () => {
  try {
    const response = await productApi.list({
      fields: 'skus,thumbnail,name,articleNumber',
      limit: 100,
    });
    products.value = response.items;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};

// Flatten products into SKUs with parent info
const skuEntities = computed(() => {
  if (!products.value.length) return [];

  return flattenChildren<Product, Sku>(products.value, 'skus', [
    'productId',
    'name',
    'thumbnail',
    'articleNumber',
  ]);
});

// Column order for optimal display
const skuColumnOrder = [
  'select',
  'parent_thumbnail',
  'parent_productId',
  'parent_name',
  '_id',
  'articleNumber',
  'name',
  'stock',
  'active',
];

// Watch selection changes
watch(
  selectedSkus,
  (newSelection) => {
    console.log(`Selected ${newSelection.include.length} SKUs`);
    console.log(`Excluded ${newSelection.exclude.length} SKUs`);
  },
  { deep: true },
);

// Fetch on mount
onMounted(() => {
  fetchProducts();
});

// Method to get selected SKU objects (not just IDs)
const getSelectedSkuObjects = computed(() => {
  return skuEntities.value.filter((sku) =>
    selectedSkus.value.include.includes(sku._id),
  );
});

// Method to submit selection
const handleSubmit = async () => {
  try {
    await $fetch('/api/quotation/skus', {
      method: 'POST',
      body: {
        skuIds: selectedSkus.value.include,
        excludedSkuIds: selectedSkus.value.exclude,
      },
    });
    console.log('SKU selection saved!');
  } catch (error) {
    console.error('Failed to save SKU selection:', error);
  }
};
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">Select SKUs for Quotation</h2>
      <p class="text-muted-foreground">
        Choose specific SKUs from the product catalog. SKUs are grouped by
        product.
      </p>
    </div>

    <Selector
      :entities="skuEntities"
      entity-name="sku"
      :mode="SelectorMode.Simple"
      v-model:simple-selection="selectedSkus"
      :columns-order="skuColumnOrder"
      :table-grouping="{
        groupBy: ['parent_productId'],
        enableExpanding: true,
        defaultExpanded: false,
      }"
      :allow-exclusions="true"
      :selection-strategy="SelectorSelectionStrategy.None"
    />

    <div v-if="selectedSkus.include.length" class="rounded-lg border p-4">
      <h3 class="mb-2 font-semibold">Selection Summary</h3>
      <div class="space-y-1 text-sm">
        <p>
          <strong>{{ selectedSkus.include.length }}</strong> SKUs selected
        </p>
        <p v-if="selectedSkus.exclude.length">
          <strong>{{ selectedSkus.exclude.length }}</strong> SKUs excluded
        </p>
        <p>
          <strong>{{ getSelectedSkuObjects.length }}</strong> unique products
          affected
        </p>
      </div>
    </div>

    <div class="flex gap-3">
      <Button @click="handleSubmit" :disabled="!selectedSkus.include.length">
        Create Quotation with {{ selectedSkus.include.length }} SKUs
      </Button>
      <Button
        variant="outline"
        @click="selectedSkus = getEmptySimpleSelectionBase()"
      >
        Clear Selection
      </Button>
    </div>
  </div>
</template>
```

## Key Points

### 1. **Parent Field Naming**

When using `flattenChildren`, parent fields are prefixed with `parent_`:

- `productId` becomes `parent_productId`
- `name` becomes `parent_name`
- Use these prefixed names in `groupBy` and `columnsOrder`

### 2. **Selection Mode**

Always use `SelectorMode.Simple` for SKU selection since we only need an array of IDs, not complex criteria.

### 3. **Column Order**

Include parent fields in the column order to display product context:

```ts
['select', 'parent_thumbnail', 'parent_name', '_id', 'articleNumber', ...]
```

### 4. **Grouping Configuration**

Group by the parent product ID to organize SKUs under their products:

```ts
{
  groupBy: ['parent_productId'],
  enableExpanding: true,
  defaultExpanded: false  // Start collapsed for better UX
}
```

### 5. **Selection Strategy**

Use `SelectorSelectionStrategy.None` when you want users to explicitly select SKUs (no "select all" behavior).

## Advanced Customization

### Custom Column Rendering

You can customize how parent fields are displayed:

```ts
const { getColumns } = useColumns<SkuWithParent>();

const customColumns = computed(() => {
  const cols = getColumns(skuEntities.value);

  // Customize parent_name column
  const nameCol = cols.find((c) => c.id === 'parent_name');
  if (nameCol) {
    nameCol.header = 'Product';
    nameCol.cell = ({ row }) => {
      if (row.getIsGrouped()) {
        return h(
          'div',
          { class: 'font-semibold' },
          `${row.original.parent_name} (${row.subRows.length} SKUs)`,
        );
      }
      return null; // Hide in child rows
    };
  }

  return cols;
});
```

### Filtering by Parent

Add quick filters to show SKUs from specific products:

```ts
const selectedProductIds = ref<string[]>([]);

const filteredSkuEntities = computed(() => {
  if (!selectedProductIds.value.length) return skuEntities.value;

  return skuEntities.value.filter((sku) =>
    selectedProductIds.value.includes(sku.parent_productId),
  );
});
```

### Pre-selecting SKUs

Load existing selection from API:

```ts
const loadExistingSelection = async (quotationId: string) => {
  const response = await $fetch(`/api/quotation/${quotationId}/skus`);
  selectedSkus.value = {
    include: response.skuIds || [],
    exclude: response.excludedSkuIds || [],
  };
};
```

## Troubleshooting

### SKUs Not Grouping

- Verify the `groupBy` field matches the flattened parent field name (with `parent_` prefix)
- Check that the parent field was included in the `flattenChildren` call

### Selection Not Working

- Ensure you're using `SelectorMode.Simple`
- Verify `v-model:simple-selection` is bound correctly
- Check that SKU entities have a valid `_id` field

### Performance Issues

- Limit the number of products fetched initially
- Consider pagination or infinite scroll
- Use `defaultExpanded: false` to reduce initial render

## Related Documentation

- [useEntityFlattener](/composables/useEntityFlattener)
- [useSelector](/composables/useSelector)
- [Table Grouping Guide](/guides/table-grouping)
- [Selector Component](/components/selector)
