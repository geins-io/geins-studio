# `usePriceListProductsTable`

The `usePriceListProductsTable` composable provides specialized table column configuration and management for price list products. It creates editable columns for pricing data, volume pricing, and price modes with responsive behavior and interactive features.

:::warning NOTE
This composable is specifically designed for price list product tables and will not be useful for any general purpose tables.
:::

## Features

- **Editable pricing columns** with blur event handling
- **Volume pricing management** with expandable interface
- **Price mode indicators** for different pricing strategies
- **Responsive column pinning** based on layout space
- **Integrated actions** for product management
- **VAT-aware labeling** for pricing columns
- **Read-only variant** (`setupReadOnlyPriceListColumns`) for prices that can't be edited, e.g. a company's ERP-maintained account list

## Usage

### Basic Usage

```ts
const { setupPriceListColumns, getPinnedState } = usePriceListProductsTable();

const vatDescription = computed(() => {
  return entityData.value?.exVat ? t('ex_vat') : t('inc_vat');
});

const columns: ColumnDef<Product>[] = setupPriceListColumns(
  selectedProducts.value,
  vatDescription.value,
  handleEditVolumePricing,
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

### `setupPriceListColumns`

```ts
setupPriceListColumns(
  selectedProducts: PriceListProductList[],
  vatDescription: string,
  onEditVolumePricing: (payload: { id: string; name: string }) => void,
  onDeleteProduct: (id: string) => void,
  onPriceBlur: (value: string | number, row: Row<PriceListProductList>) => void,
  onMarginBlur: (value: string | number, row: Row<PriceListProductList>) => void,
  onDiscountBlur: (value: string | number, row: Row<PriceListProductList>) => void,
  listPriceTitle?: string,
): ColumnDef<PriceListProductList>[]
```

Creates a complete column configuration for price list products with all necessary interactions.

- **Parameters**:
  - `selectedProducts`: Array of products to display
  - `vatDescription`: VAT status description for labels
  - `onEditVolumePricing`: Handler for volume pricing editing
  - `onDeleteProduct`: Handler for product deletion
  - `onPriceBlur`: Handler for price field blur events
  - `onMarginBlur`: Handler for margin field blur events
  - `onDiscountBlur`: Handler for discount field blur events
  - `listPriceTitle`: Title of the editable list price column, suffixed with `vatDescription`. Defaults to "Price list price"; the company editor passes `t('pricing.company_price')`

- **Returns**: Complete array of column definitions
- **Features**: Editable columns, actions, volume pricing, price modes

### `setupReadOnlyPriceListColumns`

```ts
setupReadOnlyPriceListColumns(
  products: PriceListProductList[],
  vatDescription: string,
  listPriceTitle: string,
  onViewVolumePricing: (payload: { id: string; name: string }) => void,
): ColumnDef<PriceListProductList>[]
```

Read-only counterpart of `setupPriceListColumns`: the same columns without inputs, the price mode column or row actions. Discount and margin use the read-only `percentage` column type, the list price column is titled `` `${listPriceTitle} (${vatDescription})` ``, sized 180 like the editable list price so the title fits, and highlighted (`meta.highlight`), and the volume pricing cell shows the tier count only (`readonly`) as a link that calls `onViewVolumePricing` — open `PriceListVolumePricingPanel` with `readonly` from it. Pair it with `getPinnedState`, which pins the list price, discount, margin and volume pricing columns. Used by the company page's Company set prices card.

### `addVolumePricingColumn`

```ts
addVolumePricingColumn(
  columns: ColumnDef<PriceListProductList>[],
  onEdit: (payload: { id: string; name: string }) => void,
  vatDescription: string,
  readonly?: boolean,
): ColumnDef<PriceListProductList>[]
```

Adds a volume pricing column to an existing column configuration.

- **Parameters**:
  - `columns`: Existing column definitions
  - `onEdit`: Handler for editing volume pricing
  - `vatDescription`: VAT status for proper labeling
  - `readonly`: render the cell's tier count only, without the edit/add button (default `false`)

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
function usePriceListProductsTable(): UsePriceListProductsTableReturnType;

interface UsePriceListProductsTableReturnType {
  setupPriceListColumns: (
    selectedProducts: PriceListProductList[],
    vatDescription: string,
    onEditVolumePricing: (payload: { id: string; name: string }) => void,
    onDeleteProduct: (id: string) => void,
    onPriceBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
    onMarginBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
    onDiscountBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
    listPriceTitle?: string,
  ) => ColumnDef<PriceListProductList>[];
  setupReadOnlyPriceListColumns: (
    products: PriceListProductList[],
    vatDescription: string,
    listPriceTitle: string,
    onViewVolumePricing: (payload: { id: string; name: string }) => void,
  ) => ColumnDef<PriceListProductList>[];
  addVolumePricingColumn: (
    columns: ColumnDef<PriceListProductList>[],
    onEdit: (payload: { id: string; name: string }) => void,
    vatDescription: string,
    readonly?: boolean,
  ) => ColumnDef<PriceListProductList>[];
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
