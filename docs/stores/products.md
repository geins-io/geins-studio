# `useProductsStore`

The `useProductsStore` Pinia store manages product catalog data including products, categories, and brands. It provides centralized data fetching, localization transformation, initialization management, and utility methods for product-related operations.

## Features

- **Product catalog management** (products, categories, brands)
- **Localization transformation** based on current language
- **Parallel data initialization** with error handling
- **Thumbnail generation** for product media

## Usage

```ts
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();

// Access reactive state
const { products, categories, brands, ready } = productsStore;

// Initialize store
await productsStore.init();

// Fetch specific data
const products = await productsStore.fetchProducts(['localizations', 'media']);
const categories = await productsStore.fetchCategories();
const brands = await productsStore.fetchBrands();
```

## Properties

### `products`

A `ref` containing the transformed product list.

- **Type**: `Ref<Product[]>`
- **Default**: Empty array
- **Features**: Localized data, thumbnail URLs included

### `categories`

A `ref` containing the transformed category list.

- **Type**: `Ref<Category[]>`
- **Default**: Empty array
- **Features**: Localized names and data

### `brands`

A `ref` containing the transformed brand list.

- **Type**: `Ref<Brand[]>`
- **Default**: Empty array
- **Features**: Localized names and data

### `ready`

A `ref` indicating whether all data has been successfully loaded.

- **Type**: `Ref<boolean>`
- **Default**: `false`
- **Logic**: `true` when all parallel fetches succeed

### `initialized`

A `ref` tracking whether the store has been initialized.

- **Type**: `Ref<boolean>`
- **Default**: `false`
- **Usage**: Prevents duplicate initialization calls

## Methods

### Data Fetching

#### `fetchProducts`

```ts
fetchProducts(fields?: ProductFieldsFilter[]): Promise<Product[]>
```

Fetches and transforms products from the API.

- **Parameters:**
  - `fields`: Optional array of fields to include (default: `['localizations', 'media', 'prices']`)
- **Returns**: Promise resolving to transformed products array
- **Features**: Automatic localization and thumbnail generation

#### `fetchCategories`

```ts
fetchCategories(): Promise<Category[]>
```

Fetches and transforms categories from the API.

- **Returns**: Promise resolving to localized categories array

#### `fetchBrands`

```ts
fetchBrands(): Promise<Brand[]>
```

Fetches and transforms brands from the API.

- **Returns**: Promise resolving to localized brands array

#### `init`

```ts
init(): Promise<void>
```

Initializes the store by fetching all data in parallel.

- **Features**:
  - Parallel API calls for performance
  - Error handling with logging
  - Sets `ready` state based on success
  - Prevents duplicate initialization
  - Detailed error logging for failed calls

#### `reset`

```ts
reset(): void
```

Resets all store state to initial values.

- **Resets**: products, categories, brands arrays and ready state

### Utility Methods

#### `getCategoryName`

```ts
getCategoryName(id: string): string
```

Gets category name by ID.

- **Parameters:**
  - `id`: Category ID to look up
- **Returns**: Category name or empty string if not found

#### `getBrandName`

```ts
getBrandName(id: string): string
```

Gets brand name by ID.

- **Parameters:**
  - `id`: Brand ID to look up
- **Returns**: Brand name or empty string if not found

### Transformation Methods

#### `transformProducts`

```ts
transformProducts(products: Product[]): Product[]
```

Transforms products with localization and thumbnail generation.

- **Features**:
  - Merges localized data for current language
  - Adds thumbnail URL from first media item
  - Handles missing data gracefully

#### `transformCategories`

```ts
transformCategories(categories: Category[]): Category[]
```

Transforms categories with localization for current language.

#### `transformBrands`

```ts
transformBrands(brands: Brand[]): Brand[]
```

Transforms brands with localization for current language.

## Example

```vue
<script setup lang="ts">
const productsStore = useProductsStore();
const { products, categories, brands, ready } = productsStore;

// Initialize on mount
onMounted(async () => {
  await productsStore.init();
  if (ready.value) {
    console.log(`Loaded ${products.value.length} products`);
  }
});

// Get category name for a product
const getProductCategoryName = (product: Product) => {
  return productsStore.getCategoryName(product.categoryId);
};

// Get brand name for a product
const getProductBrandName = (product: Product) => {
  return productsStore.getBrandName(product.brandId);
};

// Refresh products with specific fields
const refreshProducts = async () => {
  await productsStore.fetchProducts([
    'localizations',
    'media',
    'prices',
    'stock',
  ]);
};
</script>

<template>
  <div v-if="ready" class="product-catalog">
    <div v-for="product in products" :key="product._id" class="product-card">
      <img :src="product.thumbnail" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p>Category: {{ getProductCategoryName(product) }}</p>
      <p>Brand: {{ getProductBrandName(product) }}</p>
    </div>
  </div>
  <div v-else class="loading">Loading product catalog...</div>
</template>
```

## Type Definitions

```ts
function useProductsStore(): ProductsStoreReturnType;

interface ProductsStoreReturnType {
  products: Ref<Product[]>;
  categories: Ref<Category[]>;
  brands: Ref<Brand[]>;
  ready: Ref<boolean>;
  fetchProducts: (fields?: ProductFieldsFilter[]) => Promise<Product[]>;
  fetchCategories: () => Promise<Category[]>;
  fetchBrands: () => Promise<Brand[]>;
  init: () => Promise<void>;
  reset: () => void;
  getCategoryName: (id: string) => string;
  getBrandName: (id: string) => string;
  transformProducts: (products: Product[]) => Product[];
}

type ProductFieldsFilter =
  | 'localizations'
  | 'media'
  | 'prices'
  | 'stock'
  | 'categories'
  | 'brands';

interface Product {
  _id: string;
  name: string;
  categoryId: string;
  brandId: string;
  thumbnail?: string;
  localizations?: Record<string, any>;
  media?: Media[];
  prices?: Price[];
  [key: string]: any;
}

interface Category {
  _id: string;
  name: string;
  localizations: Record<string, any>;
  [key: string]: any;
}

interface Brand {
  _id: string;
  name: string;
  localizations: Record<string, any>;
  [key: string]: any;
}

interface Media {
  _id: string;
  [key: string]: any;
}
```

## Dependencies

This store depends on:

1. **Pinia**: For store management
2. **useGeinsRepository**: To access product API endpoints
3. **useAccountStore**: For current language context
4. **useGeinsImage**: For thumbnail URL generation
5. **useGeinsLog**: For error logging and debugging
6. **#shared/types**: For TypeScript type definitions
