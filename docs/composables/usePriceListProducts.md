# `usePriceListProducts`

The `usePriceListProducts` composable provides utilities for managing price list products and transformations. It handles converting between different product formats, managing quantity-based pricing rules, and facilitating product pricing workflows.

:::warning NOTE
These features are specifically made for price lists and pricing management. They are not general purpose product management tools.
:::

## Features

- **Product transformation** for different display formats
- **Price break management** for volume pricing
- **Flexible pricing structures** with margin, discount, and fixed pricing

## Usage

### Basic Usage

```ts
const {
  transformProductsForList,
  getVolumePricing,
  getPriceListProduct,
  addToPriceListProducts,
  getNewPriceListProducts,
  convertPriceModeToRuleField,
} = usePriceListProducts();

// Transform products for display
const displayProducts = transformProductsForList(
  priceListProducts,
  priceListEntity,
);
```

## Properties and Methods

### `transformProductsForList`

```ts
transformProductsForList(
  priceListProducts: PriceListProduct[],
  entityData: ProductPriceList
): PriceListProductList[]
```

Transforms raw price list products into a format suitable for display in lists or tables.

- **Parameters**:
  - `priceListProducts`: Array of raw price list products
  - `entityData`: Price list entity containing currency and settings

- **Returns**: Array of transformed products with display-ready properties
- **Features**: Filters base quantities, converts prices, adds thumbnails

### `getVolumePricing`

```ts
getVolumePricing(
  productId: string,
  products: PriceListProduct[],
  entityData: ProductPriceList
): PriceListRule[]
```

Extracts and formats quantity-based pricing levels for a specific product.

- **Parameters**:
  - `productId`: Target product identifier
  - `products`: Array of all price list products
  - `entityData`: Price list entity data

- **Returns**: Sorted array of quantity-based pricing rules
- **Features**: Filters by product ID, excludes base quantities, sorts by quantity

### `getPriceListProduct`

```ts
getPriceListProduct(
  productId: string,
  value: number | null,
  valueType: PriceListRuleField | undefined,
  quantity?: number
): PriceListProduct
```

Creates a price list product object with the specified pricing rule.

- **Parameters**:
  - `productId`: Product identifier
  - `value`: Numeric value for the pricing rule
  - `valueType`: Type of pricing rule ('price', 'margin', 'discountPercent')
  - `quantity`: Quantity threshold (default: 1)

- **Returns**: Formatted price list product object
- **Features**: Conditional property setting, flexible pricing types

### `addToPriceListProducts`

```ts
addToPriceListProducts(
  product: PriceListProduct,
  priceListProducts: PriceListProduct[]
): void
```

Adds or updates a product in the price list products array.

- **Parameters**:
  - `product`: Product to add or update
  - `priceListProducts`: Target array (modified in place)

- **Behavior**: Updates existing entries or adds new ones
- **Matching**: Based on product ID and staggered count

### `getNewPriceListProducts`

```ts
getNewPriceListProducts(
  newProducts: PriceListProduct[],
  currentProducts: PriceListProduct[],
  productId: string
): PriceListProduct[]
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
  priceMode?: PriceListPriceMode
): PriceListRuleField | undefined
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
function usePriceListProducts(): UsePriceListProductsReturnType;

interface UsePriceListProductsReturnType {
  transformProductsForList: (
    priceListProducts: PriceListProduct[],
    entityData: ProductPriceList,
  ) => PriceListProductList[];
  getVolumePricing: (
    productId: string,
    products: PriceListProduct[],
    entityData: ProductPriceList,
  ) => PriceListRule[];
  getPriceListProduct: (
    productId: string,
    value: number | null,
    valueType: PriceListRuleField | undefined,
    quantity?: number,
  ) => PriceListProduct;
  addToPriceListProducts: (
    product: PriceListProduct,
    priceListProducts: PriceListProduct[],
  ) => void;
  getNewPriceListProducts: (
    newProducts: PriceListProduct[],
    currentProducts: PriceListProduct[],
    productId: string,
  ) => PriceListProduct[];
  convertPriceModeToRuleField: (
    priceMode?: PriceListPriceMode,
  ) => PriceListRuleField | undefined;
}

interface PriceListRule {
  _id?: string;
  internalId?: string;
  quantity?: number;
  margin?: number;
  discountPercent?: number;
  price?: number;
  applied?: boolean;
  global?: boolean;
  lastFieldChanged?: PriceListRuleField;
}

interface PriceListProductList {
  _id: string;
  name: string;
  thumbnail: string;
  purchasePrice: Price;
  regularPrice: Price;
  listPrice?: Price;
  discount: number;
  margin: number;
  volumePricing: PriceListRule[];
  priceMode: PriceListPriceMode;
}

type PriceListPriceMode =
  | 'fixed'
  | 'margin'
  | 'discount'
  | 'rule'
  | 'auto'
  | 'autoRule'
  | 'autoFixed';
```
