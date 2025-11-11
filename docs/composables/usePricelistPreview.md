# `usePriceListPreview`

The `usePriceListPreview` composable manages price list preview functionality, handling product fetching, transformation, and state management for price list preview operations. It provides a clean interface for updating and displaying price list products with proper error handling and user feedback.

:::warning NOTE
This composable is specifically designed to work alongside other price list management composables, like [`usePriceListRules`](usePriceListRules.md) and [`usePriceListVolumePricing`](usePriceListVolumePricing.md).
:::

## Features

- **Price list preview generation** with product fetching and transformation
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
  previewPriceList,
  updateInProgress,
} = usePriceListPreview({
  entityId,
  entityDataUpdate,
  transformProductsForList,
  setupColumns,
  onUpdateProducts,
  convertPriceModeToRuleField,
  getPriceListProduct,
});

// Generate a preview
await previewPriceList('Products updated successfully');
```

## Options

### `UsePriceListPreviewOptions`

```ts
interface UsePriceListPreviewOptions {
  entityId: Ref<string | null>;
  entityDataUpdate: Ref<ProductPriceListUpdate>;
  transformProductsForList: (
    price listProducts: PriceListProduct[],
    entityData: ProductPriceList,
  ) => PriceListProductList[];
  setupColumns?: () => void; // Optional callback for setting up columns
  onUpdateProducts?: (filteredProducts: PriceListProduct[]) => Promise<void>; // Handle product updates
  convertPriceModeToRuleField?: (
    priceMode: PriceListPriceMode | undefined,
  ) => PriceListRuleField | undefined; // Price mode conversion
  getPriceListProduct?: (
    productId: string,
    value: number | null,
    priceMode: PriceListRuleField | undefined,
    staggeredCount: number,
  ) => PriceListProduct;
}
```

- **`entityId`**: Reactive reference to the current price list entity ID
- **`entityDataUpdate`**: Reactive reference to the price list entity being updated
- **`transformProductsForList`**: Function to transform raw products into display format
- **`setupColumns`**: Callback function for setting up table columns
- **`onUpdateProducts`**: Handler for updating products during preview
- **`convertPriceModeToRuleField`**: Function to convert price mode to rule field
- **`getPriceListProduct`**: Function to create price list product objects

## Properties and Methods

### `priceListProducts`

```ts
const price listProducts: Ref<PriceListProduct[]>;
```

Raw price list products fetched from the API.

### `selectedProducts`

```ts
const selectedProducts: Ref<PriceListProductList[]>;
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

### `previewPriceList`

```ts
previewPriceList(
  feedbackMessage?: string,
  updateProducts?: boolean,
  showFeedback?: boolean,
): Promise<void>
```

Generates a price list preview by fetching products based on the current selection query and rules.

- **Parameters**:
  - `feedbackMessage`: Custom message to show on successful update (default: "Price list preview updated.")
  - `updateProducts`: Whether to update the entity's product list (default: false)
  - `showFeedback`: Whether to show toast notifications (default: true)
