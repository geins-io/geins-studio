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
```
