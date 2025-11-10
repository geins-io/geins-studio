# `usePricelistPreview`

The `usePricelistPreview` composable manages pricelist preview functionality, handling product fetching, transformation, and state management for pricelist preview operations. It provides a clean interface for updating and displaying pricelist products with proper error handling and user feedback.

:::warning NOTE
This composable is specifically designed to work alongside other pricelist management composables, like [`usePricelistRules`](usePricelistRules.md) and [`usePricelistVolumePricing`](usePricelistVolumePricing.md).
:::

## Features

- **Pricelist preview generation** with product fetching and transformation
- **Product state management** with reactive updates
- **Custom pricing preservation** during product updates
- **Loading states and error handling** with user-friendly feedback
- **Flexible feedback options** for different update scenarios

## Usage

### Basic Usage

```ts
const {
  selectedProducts,
  hasProductSelection,
  previewPricelist,
  updateInProgress,
} = usePricelistPreview({
  entityId,
  entityDataUpdate,
  transformProductsForList,
  setupColumns,
  onUpdateProducts,
  convertPriceModeToRuleField,
  getPricelistProduct,
});

// Generate a preview
await previewPricelist('Products updated successfully');
```

## Options

### `UsePricelistPreviewOptions`

```ts
interface UsePricelistPreviewOptions {
  entityId: Ref<string | null>;
  entityDataUpdate: Ref<ProductPricelistUpdate>;
  transformProductsForList: (
    pricelistProducts: PricelistProduct[],
    entityData: ProductPricelist,
  ) => PricelistProductList[];
  setupColumns?: () => void; // Optional callback for setting up columns
  onUpdateProducts?: (filteredProducts: PricelistProduct[]) => Promise<void>; // Handle product updates
  convertPriceModeToRuleField?: (
    priceMode: PricelistPriceMode | undefined,
  ) => PricelistRuleField | undefined; // Price mode conversion
  getPricelistProduct?: (
    productId: string,
    value: number | null,
    priceMode: PricelistRuleField | undefined,
    staggeredCount: number,
  ) => PricelistProduct;
}
```

- **`entityId`**: Reactive reference to the current pricelist entity ID
- **`entityDataUpdate`**: Reactive reference to the pricelist entity being updated
- **`transformProductsForList`**: Function to transform raw products into display format
- **`setupColumns`**: Callback function for setting up table columns
- **`onUpdateProducts`**: Handler for updating products during preview
- **`convertPriceModeToRuleField`**: Function to convert price mode to rule field
- **`getPricelistProduct`**: Function to create pricelist product objects

## Properties and Methods

### `pricelistProducts`

```ts
const pricelistProducts: Ref<PricelistProduct[]>;
```

Raw pricelist products fetched from the API.

### `selectedProducts`

```ts
const selectedProducts: Ref<PricelistProductList[]>;
```

Transformed products ready for display in tables or lists.

### `updateInProgress`

```ts
const updateInProgress: Ref<boolean>;
```

Loading state indicating whether a preview update is in progress.

### `hasProductSelection`

```ts
const hasProductSelection: ComputedRef<boolean>;
```

Indicates whether any products are currently selected/available in the preview.

### `previewPricelist`

```ts
previewPricelist(
  feedbackMessage?: string,
  updateProducts?: boolean,
  showFeedback?: boolean,
): Promise<void>
```

Generates a pricelist preview by fetching products based on the current selection query and rules.

- **Parameters**:
  - `feedbackMessage`: Custom message to show on successful update (default: "Pricelist preview updated.")
  - `updateProducts`: Whether to update the entity's product list (default: false)
  - `showFeedback`: Whether to show toast notifications (default: true)
