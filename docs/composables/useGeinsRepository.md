# `useGeinsRepository`

The `useGeinsRepository` composable provides pre-configured repository instances with the Geins API client automatically injected. It simplifies access to different domain-specific repositories (order, product, etc.) that are ready to use with the current Geins API configuration and offer standardized CRUD operations.

## Features

- Provides pre-configured repository instances for different domains
- Automatically injects the Geins API client
- Offers type-safe access to all repository methods

## Usage

### Basic Usage

```ts
// Access product repository for CRUD operations
const { productApi } = useGeinsRepository();

// Fetching data on page load - recommended to use useAsyncData
const { data, error, refresh } = await useAsyncData<Product[]>(
  'products-list',
  () => productApi.product.list(),
);

// Creating a new product
try {
  const newProduct = await productApi.product.create({
    name: 'New Product',
    price: 19.99,
  });
} catch (e) {
  console.error('Error creating product:', e);
}
```

## Properties and Methods

The composable exposes the following repository instances, each with their own set of methods for interacting with the Geins API. Read more about all basic CRUD methods in [API Repositories](/concepts/api-repositories).

### `globalApi`

#### `account`

```ts
function get(): Promise<Account>;
```

#### `channel`

```ts
function list(): Promise<Channel[]>;
```

#### `currency`

```ts
function list(): Promise<Currency[]>;
```

#### `language`

```ts
function list(): Promise<Language[]>;
```

### `orderApi`

```ts
function get(id: string, options?: OrderApiOptions): Promise<Order>;
function list(options?: OrderApiOptions): Promise<Order[]>;
function query(
  batchQuery: OrderBatchQuery,
  options?: OrderApiOptions,
): Promise<BatchQueryResult<Order>>;
```

### `productApi`

```ts
function get(id: string, options?: ProductApiOptions): Promise<Product>;
function list(options?: ProductApiOptions): Promise<BatchQueryResult<Product>>;
function create(data: ProductCreate, options?: ProductApiOptions): Promise<Product>;
function update(id: string, data: ProductUpdate, options?: ProductApiOptions): Promise<Product>;
function delete(id: string): Promise<void>;
function query(
  selection?: SelectorSelectionQueryBase,
  options?: ProductApiOptions,
): Promise<BatchQueryResult<Product>>;
```

#### `category`

```ts
function get(id: number): Promise<Category>;
function list(
  query?: Record<string, unknown>,
): Promise<BatchQueryResult<Category>>;
function query(ids: number[]): Promise<BatchQueryResult<Category>>;
```

#### `brand`

```ts
function get(id: number): Promise<Brand>;
function list(
  query?: Record<string, unknown>,
): Promise<BatchQueryResult<Brand>>;
function query(ids: number[]): Promise<BatchQueryResult<Brand>>;
```

#### `pricelist`

```ts
function get(id: string, options?: ProductPricelistApiOptions): Promise<ProductPricelist>;
function list(options?: ProductPricelistApiOptions): Promise<ProductPricelist[]>;
function create(data: ProductPricelistCreate, options?: ProductPricelistApiOptions): Promise<ProductPricelist>;
function update(id: string, data: ProductPricelistUpdate, options?: ProductPricelistApiOptions): Promise<ProductPricelist>;
function delete(id: string): Promise<void>;
```

##### `id(pricelistId: string)`

```ts
function copy(options?: ProductPricelistApiOptions): Promise<ProductPricelist>;
function preview(
  pricelist: ProductPricelistUpdate,
  batchQuery?: BatchQuery,
  options?: ProductPricelistApiOptions,
): Promise<ProductPricelist>;
function previewPrice(
  pricelistProduct: PricelistProductPreview,
): Promise<PricelistProductPreviewResponse>;
```

### `wholesaleApi`

#### `account`

```ts
function get(id: string, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function list(options?: WholesaleAccountApiOptions): Promise<WholesaleAccount[]>;
function create(data: WholesaleAccountCreate, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function update(id: string, data: WholesaleAccountUpdate, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function delete(id: string): Promise<void>;
```

##### `tags`

```ts
function get(): Promise<string[]>;
```

##### `id(accountId: string)`

Has no methods itself but provides access to the following sub-repositories:

###### `buyer`

`wholesaleApi.id(accountId).buyer`

```ts
function get(id: string): Promise<WholesaleBuyer>;
function list(): Promise<WholesaleBuyer[]>;
function create(data: WholesaleBuyerCreate): Promise<WholesaleBuyer>;
function update(id: string, data: WholesaleBuyerUpdate): Promise<WholesaleBuyer>;
function delete(id: string): Promise<void>;
function assign(id: string): Promise<void>;
```

#### `buyer`

`wholesaleApi.buyer`

```ts
function get(id: string): Promise<WholesaleBuyer>;
function list(): Promise<WholesaleBuyer[]>;
```

#### `validateVatNumber`

```ts
function validateVatNumber(vatNumber: string): Promise<WholesaleVatValidation>;
```

### `userApi`

```ts
function get(id: string): Promise<User>;
function list(): Promise<User[]>;
function create(data: UserCreate): Promise<User>;
function update(id: string, data: UserUpdate): Promise<User>;
function delete(id: string): Promise<void>;
```

#### `password`

```ts
function beginRestore(email: string, callbackUrl: string): Promise<void>;
function restore(token: string, password: string): Promise<void>;
```

### `customerApi`

```ts
function get(id: string): Promise<Customer>;
function list(): Promise<Customer[]>;
function create(data: CustomerCreate): Promise<Customer>;
function update(id: string, data: CustomerUpdate): Promise<Customer>;
function delete(id: string): Promise<void>;
```

## Dependencies

This composable depends on:

1. **`$geinsApi`**: Accesses the Nuxt app context to retrieve the injected `$geinsApi` client.
2. **`@/utils/repos`**: Imports the repository factory functions that create domain-specific repository instances.

## Repository Pattern

The composable follows the repository pattern where each domain has its own repository with standardized methods:

- **CRUD Operations**: Create, Read, Update, Delete operations for entities
- **Domain-Specific Methods**: Specialized methods for each domain's unique requirements
- **Type Safety**: Full TypeScript support with proper typing for all operations

## Type Definitions

```ts
function useGeinsRepository(): UseGeinsRepositoryReturnType;

interface UseGeinsRepositoryReturnType {
  globalApi: ReturnType<typeof repo.global>;
  orderApi: ReturnType<typeof repo.order>;
  productApi: ReturnType<typeof repo.product>;
  wholesaleApi: ReturnType<typeof repo.wholesale>;
  userApi: ReturnType<typeof repo.user>;
  customerApi: ReturnType<typeof repo.customer>;
}
```
