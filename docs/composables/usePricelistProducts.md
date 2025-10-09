# `usePricelistProducts`

The `usePricelistProducts` composable provides utilities for managing pricelist products and transformations. It handles converting between different product formats, managing quantity-based pricing rules, and facilitating product pricing workflows.

:::warning NOTE
These features are specifically made for pricelists and wholesale pricing management. They are not general purpose product management tools.
:::

## Features

- **Product transformation** for different display formats
- **Quantity level management** with pricing rules
- **Flexible pricing structures** with margin, discount, and fixed pricing

## Usage

### Basic Usage

```ts
const {
  transformProductsForList,
  getQuantityLevels,
  getPricelistProduct,
  addToPricelistProducts,
  getNewPricelistProducts,
  convertPriceModeToRuleField,
} = usePricelistProducts();

// Transform products for display
const displayProducts = transformProductsForList(
  pricelistProducts,
  pricelistEntity,
);
```

## Properties and Methods

### `transformProductsForList`

```ts
transformProductsForList(
  pricelistProducts: PricelistProduct[],
  entityData: ProductPricelist
): PricelistProductList[]
```

Transforms raw pricelist products into a format suitable for display in lists or tables.

- **Parameters**:
  - `pricelistProducts`: Array of raw pricelist products
  - `entityData`: Pricelist entity containing currency and settings

- **Returns**: Array of transformed products with display-ready properties
- **Features**: Filters base quantities, converts prices, adds thumbnails

### `getQuantityLevels`

```ts
getQuantityLevels(
  productId: string,
  products: PricelistProduct[],
  entityData: ProductPricelist
): PricelistRule[]
```

Extracts and formats quantity-based pricing levels for a specific product.

- **Parameters**:
  - `productId`: Target product identifier
  - `products`: Array of all pricelist products
  - `entityData`: Pricelist entity data

- **Returns**: Sorted array of quantity-based pricing rules
- **Features**: Filters by product ID, excludes base quantities, sorts by quantity

### `getPricelistProduct`

```ts
getPricelistProduct(
  productId: string,
  value: number | null,
  valueType: PricelistRuleField | undefined,
  quantity?: number
): PricelistProduct
```

Creates a pricelist product object with the specified pricing rule.

- **Parameters**:
  - `productId`: Product identifier
  - `value`: Numeric value for the pricing rule
  - `valueType`: Type of pricing rule ('price', 'margin', 'discountPercent')
  - `quantity`: Quantity threshold (default: 1)

- **Returns**: Formatted pricelist product object
- **Features**: Conditional property setting, flexible pricing types

### `addToPricelistProducts`

```ts
addToPricelistProducts(
  product: PricelistProduct,
  pricelistProducts: PricelistProduct[]
): void
```

Adds or updates a product in the pricelist products array.

- **Parameters**:
  - `product`: Product to add or update
  - `pricelistProducts`: Target array (modified in place)

- **Behavior**: Updates existing entries or adds new ones
- **Matching**: Based on product ID and staggered count

### `getNewPricelistProducts`

```ts
getNewPricelistProducts(
  newProducts: PricelistProduct[],
  currentProducts: PricelistProduct[],
  productId: string
): PricelistProduct[]
```

Merges new products with existing ones for a specific product ID.

- **Parameters**:
  - `newProducts`: Array of new product rules
  - `currentProducts`: Current product array
  - `productId`: Target product identifier

- **Returns**: Merged array with updates applied
- **Features**: Handles additions, updates, and deletions

### `convertPriceModeToRuleField`

```ts
convertPriceModeToRuleField(
  priceMode?: PricelistPriceMode
): PricelistRuleField | undefined
```

Converts a price mode enumeration to the corresponding rule field type.

- **Parameters**:
  - `priceMode`: Price mode ('margin', 'discount', 'fixed', 'auto')

- **Returns**: Corresponding rule field or undefined
- **Mapping**:
  - `'margin'` → `'margin'`
  - `'discount'` → `'discountPercent'`
  - `'fixed'` → `'price'`
  - `'auto'` → `undefined`

## Type Definitions

```ts
function usePricelistProducts(): UsePricelistProductsReturnType;

interface UsePricelistProductsReturnType {
  transformProductsForList: (
    pricelistProducts: PricelistProduct[],
    entityData: ProductPricelist,
  ) => PricelistProductList[];
  getQuantityLevels: (
    productId: string,
    products: PricelistProduct[],
    entityData: ProductPricelist,
  ) => PricelistRule[];
  getPricelistProduct: (
    productId: string,
    value: number | null,
    valueType: PricelistRuleField | undefined,
    quantity?: number,
  ) => PricelistProduct;
  addToPricelistProducts: (
    product: PricelistProduct,
    pricelistProducts: PricelistProduct[],
  ) => void;
  getNewPricelistProducts: (
    newProducts: PricelistProduct[],
    currentProducts: PricelistProduct[],
    productId: string,
  ) => PricelistProduct[];
  convertPriceModeToRuleField: (
    priceMode?: PricelistPriceMode,
  ) => PricelistRuleField | undefined;
}

interface PricelistRule {
  quantity: number;
  price?: number;
  margin?: number;
  discountPercent?: number;
  global: boolean;
  lastFieldChanged?: PricelistRuleField;
}

interface PricelistProductList {
  _id: string;
  name: string;
  thumbnail: string;
  purchasePrice: string;
  regularPrice: string;
  listPrice: string;
  discount: number;
  margin: number;
  quantityLevels: PricelistRule[];
  priceMode: string;
}
```
