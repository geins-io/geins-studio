# `useSelector`

The `useSelector` composable provides utilities for managing product selector state and transformations. It handles complex product selection logic with include/exclude conditions, various criteria types, and conversions between different selector formats used throughout the application.

:::warning NOTE
This composable is designed specifically for the Selector component and related functionalities.
:::

## Features

- **Multiple selector formats** (Query, Internal, Simple)
- **Include/exclude logic** for complex product filtering
- **Format conversions** between different selector types
- **Default data generation** for empty states and fallbacks
- **Complex criteria support** (categories, brands, prices, stock, product IDs)
- **Condition management** (AND/OR logic)
- **Entity type support** (Product, SKU, or Default) for different selection contexts
- **Hierarchical entity selection** with parent-child relationships (products with SKUs)

## Usage

### Basic Selector Management

```ts
const {
  getFallbackSelection,
  getEmptyInternalSelectionBase,
  convertToInternalSelection,
  convertToQuerySelection,
  convertToSimpleSelection,
} = useSelector();

// Create a new empty selector
const currentSelection = ref(getEmptyInternalSelectionBase());

// Initialize with fallback data
const initializeSelector = () => {
  currentSelection.value = {
    include: getFallbackSelection(),
    exclude: getFallbackSelection(),
  };
};

// Convert between formats as needed
const queryFormat = computed(() => {
  return convertToQuerySelection(currentSelection.value.include);
});
```

### Simple Product ID Selection

```ts
const {
  getEmptySimpleSelectionBase,
  convertSimpleToInternalSelectionBase,
  convertToSimpleSelectionBase,
} = useSelector();

// Simple include/exclude by product IDs only
const simpleSelection = ref(getEmptySimpleSelectionBase());

// Add products to include list
const includeProducts = (productIds: string[]) => {
  simpleSelection.value.include = [
    ...simpleSelection.value.include,
    ...productIds,
  ];
};

// Add products to exclude list
const excludeProducts = (productIds: string[]) => {
  simpleSelection.value.exclude = [
    ...simpleSelection.value.exclude,
    ...productIds,
  ];
};
```

### SKU selection with hierarchical data

The selector now supports SKU-level selection with hierarchical product-SKU relationships. When using `SelectorEntityType.Sku`, products with multiple SKUs are shown as expandable rows, while products with a single SKU collapse to a single selectable row.

Use `transformProductsToSelectorEntities` to easily convert products with SKUs into the correct format:

```vue
<script setup lang="ts">
import {
  SelectorMode,
  SelectorEntityType,
  type SelectorEntity,
} from '#shared/types';

const {
  transformProductsToSelectorEntities,
  getFallbackSelection,
  convertToSimpleSelection,
} = useSelector();

const { productApi } = useGeinsRepository();

// Fetch and transform products to include SKUs as children
const productsWithSkus = ref<SelectorEntity[]>([]);
const selection = ref(getFallbackSelection());

onMounted(async () => {
  const response = await productApi.list({ fields: ['media', 'skus'] });
  productsWithSkus.value = transformProductsToSelectorEntities(response.items);
});
</script>

<template>
  <SelectorPanel
    :selection="selection"
    :mode="SelectorMode.Simple"
    entity-name="sku"
    :entities="productsWithSkus"
    :entity-type="SelectorEntityType.Sku"
    @save="updateSelection"
  />
</template>
```

:::tip SKU selection behavior

- **Products with multiple SKUs**: Display as expandable rows with a chevron button. Only child SKUs can be selected.
- **Products with single SKU**: Collapse to a single row with the checkbox on the parent. Selecting the parent selects the SKU.
- **Search functionality**: Searches across both product IDs and SKU IDs, automatically expanding parents when SKU matches are found.

:::

## Properties and Methods

### Creation Methods

#### `getFallbackSelection`

```ts
getFallbackSelection(): SelectorSelectionInternal
```

Creates a fallback selection with default values and AND condition.

- **Returns**: Default internal selection with empty arrays and AND condition
- **Usage**: Initialize selectors, provide defaults when data is missing

#### `getEmptyInternalSelectionBase`

```ts
getEmptyInternalSelectionBase(): SelectorSelectionInternalBase
```

Creates an empty internal selection base with include/exclude structure.

#### `getEmptyQuerySelectionBase`

```ts
getEmptyQuerySelectionBase(): SelectorSelectionQueryBase
```

Creates an empty query selection base suitable for API communication.

#### `getEmptySimpleSelectionBase`

```ts
getEmptySimpleSelectionBase(): SelectorSelectionSimpleBase
```

Creates an empty simple selection base with just include/exclude ID arrays.

### Conversion Methods

#### `convertToInternalSelection`

```ts
convertToInternalSelection(
  selections: SelectorSelectionQuery[]
): SelectorSelectionInternal
```

Converts query selection array to internal format with merged criteria.

- **Features**: Merges multiple selections, handles array consolidation
- **Logic**: Takes condition from first selection, merges all arrays

#### `convertToQuerySelection`

```ts
convertToQuerySelection(
  selection: SelectorSelectionInternal
): SelectorSelectionQuery[]
```

Converts internal selection to query format array.

- **Returns**: Array with separate objects for criteria and product IDs
- **Structure**: Splits different criteria types into separate query objects

#### `convertToSimpleSelection`

```ts
convertToSimpleSelection(
  selection: SelectorSelectionInternal
): SelectorSelectionSimple
```

Extracts just the product IDs from an internal selection.

- **Returns**: Array of product ID strings
- **Usage**: When only product IDs are needed for simple operations

### Base Conversion Methods

#### `convertToInternalSelectionBase`

```ts
convertToInternalSelectionBase(
  selection: SelectorSelectionQueryBase
): SelectorSelectionInternalBase
```

Converts query base to internal base format.

#### `convertToQuerySelectionBase`

```ts
convertToQuerySelectionBase(
  selection: SelectorSelectionInternalBase
): SelectorSelectionQueryBase
```

Converts internal base to query base format.

#### `convertSimpleToInternalSelectionBase`

```ts
convertSimpleToInternalSelectionBase(
  selection: SelectorSelectionSimpleBase
): SelectorSelectionInternalBase
```

Converts simple base format to internal base format.

#### `convertToSimpleSelectionBase`

```ts
convertToSimpleSelectionBase(
  selection: SelectorSelectionQueryBase
): SelectorSelectionSimpleBase
```

Converts query base format to simple base format with just include/exclude ID arrays.

### Transformation Methods

#### `transformProductsToSelectorEntities`

```ts
transformProductsToSelectorEntities(
  products: Product[],
  idPrefix?: string
): SelectorEntity[]
```

Transforms products with SKUs into SelectorEntity format for hierarchical selection in the selector panel. Automatically handles thumbnail generation using `useGeinsImage`.

- **Parameters**:
  - `products`: Array of Product objects with SKUs
  - `idPrefix`: Prefix for parent product IDs when expanded (default: 'p-')
- **Returns**: Array of SelectorEntity objects with nested SKU structure

- **Behavior**:
  - Products with **single SKU** are collapsed (`isCollapsed: true`) - the parent row shows the SKU ID and is directly selectable
  - Products with **multiple SKUs** are expandable - parent shows product ID with prefix, children show individual SKU IDs
  - Thumbnails are automatically generated from product media using `useGeinsImage`

## Type Definitions

```ts
function useSelector(): UseSelectorReturnType;

interface UseSelectorReturnType {
  dummyData: SelectorSelectionQueryBase;
  getFallbackSelection: () => SelectorSelectionInternal;
  getEmptyInternalSelectionBase: () => SelectorSelectionInternalBase;
  getEmptyQuerySelectionBase: () => SelectorSelectionQueryBase;
  getEmptySimpleSelectionBase: () => SelectorSelectionSimpleBase;
  convertToInternalSelection: (
    selections: SelectorSelectionQuery[],
  ) => SelectorSelectionInternal;
  convertToInternalSelectionBase: (
    selection: SelectorSelectionQueryBase,
  ) => SelectorSelectionInternalBase;
  convertToQuerySelection: (
    selection: SelectorSelectionInternal,
  ) => SelectorSelectionQuery[];
  convertToQuerySelectionBase: (
    selection: SelectorSelectionInternalBase,
  ) => SelectorSelectionQueryBase;
  convertSimpleToInternalSelectionBase: (
    selection: SelectorSelectionSimpleBase,
  ) => SelectorSelectionInternalBase;
  convertToSimpleSelection: (
    selection: SelectorSelectionInternal,
  ) => SelectorSelectionSimple;
  convertToSimpleSelectionBase: (
    selection: SelectorSelectionQueryBase,
  ) => SelectorSelectionSimpleBase;
  transformProductsToSelectorEntities: (
    products: Product[],
    idPrefix?: string,
  ) => SelectorEntity[];
}

// Supporting enums
enum SelectorCondition {
  And = 'and',
  Or = 'or',
}

enum CompareCondition {
  LessThan = 'lt',
  GreaterThan = 'gt',
  Equal = 'eq',
}

enum SelectorEntityType {
  Product = 'product',
  Sku = 'sku',
  Default = 'default',
}

type SelectorSelectionSimple = string[];

interface SelectorSelectionQuery {
  condition?: SelectorCondition;
  categoryIds?: string[];
  brandIds?: string[];
  price?: PriceSelection[];
  stock?: StockSelection[];
  productIds?: string[];
}

interface SelectorSelectionInternal
  extends Omit<SelectorSelectionQuery, 'productIds'> {
  ids?: string[];
}

type SelectorSelectionGroup = BatchQueryFilterGroup<SelectorSelectionQuery>;
type SelectorSelectionQueryBase = BatchQueryFiltered<SelectorSelectionQuery>;

interface SelectorSelectionInternalBase {
  include: SelectorSelectionInternal;
  exclude: SelectorSelectionInternal;
}

interface SelectorSelectionSimpleBase {
  include: SelectorSelectionSimple;
  exclude: SelectorSelectionSimple;
}

interface SelectorEntity extends EntityBaseWithName {
  image?: string;
  thumbnail?: string;
  articleNumber?: string;
  skus?: SelectorEntity[]; // Nested entities for hierarchical selection
  productId?: string; // Reference to parent product when entity is a SKU
  isCollapsed?: boolean; // True for products with single SKU
}
```
