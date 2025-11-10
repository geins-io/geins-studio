# `usePricelistProductsTable`

The `usePricelistProductsTable` composable provides specialized table column configuration and management for pricelist products. It creates editable columns for pricing data, volume pricing, and price modes with responsive behavior and interactive features.

:::warning NOTE
This composable is specifically designed for pricelist product tables and will not be useful for any general purpose tables.
:::

## Features

- **Editable pricing columns** with blur event handling
- **Volume pricing management** with expandable interface
- **Price mode indicators** for different pricing strategies
- **Responsive column pinning** based on layout space
- **Integrated actions** for product management
- **VAT-aware labeling** for pricing columns

## Usage

### Basic Usage

```ts
const { setupPricelistColumns, getPinnedState } = usePricelistProductsTable();

const vatDescription = computed(() => {
  return entityData.value?.exVat ? t('ex_vat') : t('inc_vat');
});

const columns: ColumnDef<Product>[] = setupPricelistColumns(
  selectedProducts.value,
  vatDescription.value,
  handleEditQuantityLevels,
  handleDeleteProduct,
  handlePriceBlur,
  handleMarginBlur,
  handleDiscountBlur,
);

const pinnedState = computed(() => getPinnedState.value);
```

```vue
<template>
  <TableView
    :columns="columns"
    :data="products"
    :pinned-state="pinnedState"
    ...
  />
</template>
```

## Properties and Methods

### `setupPricelistColumns`

```ts
setupPricelistColumns(
  selectedProducts: PricelistProductList[],
  vatDescription: string,
  onEditQuantityLevels: (payload: { id: string; name: string }) => void,
  onDeleteProduct: (id: string) => void,
  onPriceBlur: (value: string | number, row: Row<PricelistProductList>) => void,
  onMarginBlur: (value: string | number, row: Row<PricelistProductList>) => void,
  onDiscountBlur: (value: string | number, row: Row<PricelistProductList>) => void,
): ColumnDef<PricelistProductList>[]
```

Creates a complete column configuration for pricelist products with all necessary interactions.

- **Parameters**:
  - `selectedProducts`: Array of products to display
  - `vatDescription`: VAT status description for labels
  - `onEditQuantityLevels`: Handler for volume pricing editing
  - `onDeleteProduct`: Handler for product deletion
  - `onPriceBlur`: Handler for price field blur events
  - `onMarginBlur`: Handler for margin field blur events
  - `onDiscountBlur`: Handler for discount field blur events

- **Returns**: Complete array of column definitions
- **Features**: Editable columns, actions, volume pricing, price modes

### `addQuantityLevelsColumn`

```ts
addQuantityLevelsColumn(
  columns: ColumnDef<PricelistProductList>[],
  onEdit: (payload: { id: string; name: string }) => void,
  vatDescription: string,
): ColumnDef<PricelistProductList>[]
```

Adds a volume pricing column to an existing column configuration.

- **Parameters**:
  - `columns`: Existing column definitions
  - `onEdit`: Handler for editing volume pricing
  - `vatDescription`: VAT status for proper labeling

- **Returns**: Updated column array with volume pricing column
- **Features**: Custom cell component, fixed sizing, interactive editing

### `getPinnedState`

```ts
getPinnedState: ComputedRef<{
  left: never[];
  right: string[];
}>;
```

Computed property that returns appropriate column pinning configuration based on layout space.

- **Returns**: Object with left and right pinned column arrays
- **Responsive behavior**:
  - Reduced space: Pins only essential columns (priceMode, actions)
  - Full space: Pins pricing and action columns on the right
- **Purpose**: Keeps important columns visible during horizontal scrolling

## Type Definitions

```ts
function usePricelistProductsTable(): UsePricelistProductsTableReturnType;

interface UsePricelistProductsTableReturnType {
  setupPricelistColumns: (
    selectedProducts: PricelistProductList[],
    vatDescription: string,
    onEditQuantityLevels: (payload: { id: string; name: string }) => void,
    onDeleteProduct: (id: string) => void,
    onPriceBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
    onMarginBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
    onDiscountBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
  ) => ColumnDef<PricelistProductList>[];
  addQuantityLevelsColumn: (
    columns: ColumnDef<PricelistProductList>[],
    onEdit: (payload: { id: string; name: string }) => void,
    vatDescription: string,
  ) => ColumnDef<PricelistProductList>[];
  getPinnedState: ComputedRef<{
    left: never[];
    right: string[];
  }>;
}
```

## Dependencies

This composable depends on:

1. **useColumns** for base column functionality
2. **useLayout** for responsive behavior
3. **useI18n** for internationalization
4. **TanStack Vue Table** for table types and functionality
