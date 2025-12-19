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

`globalApi.account`

```ts
function get(): Promise<Account>;
```

#### `channel`

`globalApi.channel`

```ts
function list(): Promise<Channel[]>;
```

#### `currency`

`globalApi.currency`

```ts
function list(): Promise<Currency[]>;
```

#### `language`

`globalApi.language`

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

`productApi.category`

```ts
function get(id: number): Promise<Category>;
function list(
  query?: Record<string, unknown>,
): Promise<BatchQueryResult<Category>>;
function query(ids: number[]): Promise<BatchQueryResult<Category>>;
```

#### `brand`

`productApi.brand`

```ts
function get(id: number): Promise<Brand>;
function list(
  query?: Record<string, unknown>,
): Promise<BatchQueryResult<Brand>>;
function query(ids: number[]): Promise<BatchQueryResult<Brand>>;
```

#### `priceList`

`productApi.priceList`

```ts
function get(id: string, options?: ProductPriceListApiOptions): Promise<ProductPriceList>;
function list(options?: ProductPriceListApiOptions): Promise<ProductPriceList[]>;
function create(data: ProductPriceListCreate, options?: ProductPriceListApiOptions): Promise<ProductPriceList>;
function update(id: string, data: ProductPriceListUpdate, options?: ProductPriceListApiOptions): Promise<ProductPriceList>;
function delete(id: string): Promise<void>;
```

##### `id(priceListId: string)`

`productApi.priceList.id(priceListId)`

```ts
function copy(options?: ProductPriceListApiOptions): Promise<ProductPriceList>;
function preview(
  price list: ProductPriceListUpdate,
  batchQuery?: BatchQuery,
  options?: ProductPriceListApiOptions,
): Promise<ProductPriceList>;
function previewPrice(
  price listProduct: PriceListProductPreview,
): Promise<PriceListProductPreviewResponse>;
```

### `customersApi`

Customer account management API for creating, updating, and managing customer accounts and buyers.

#### `account`

`customersApi.account`

```ts
function get(id: string, options?: CustomerAccountApiOptions): Promise<CustomerAccount>;
function list(options?: CustomerAccountApiOptions): Promise<CustomerAccount[]>;
function create(data: CustomerAccountCreate, options?: CustomerAccountApiOptions): Promise<CustomerAccount>;
function update(id: string, data: CustomerAccountUpdate, options?: CustomerAccountApiOptions): Promise<CustomerAccount>;
function delete(id: string): Promise<void>;
```

##### `tags`

`customersApi.account.tags`

```ts
function get(): Promise<string[]>;
```

##### `id(accountId: string)`

Has no methods itself but provides access to the following sub-repositories:

###### `buyer`

`customersApi.account.id(accountId).buyer`

```ts
function get(id: string): Promise<CustomerBuyer>;
function list(): Promise<CustomerBuyer[]>;
function create(data: CustomerBuyerCreate): Promise<CustomerBuyer>;
function update(id: string, data: CustomerBuyerUpdate): Promise<CustomerBuyer>;
function delete(id: string): Promise<void>;
function assign(id: string): Promise<void>;
```

#### `validateVatNumber`

`customersApi.validateVatNumber`

```ts
function validateVatNumber(vatNumber: string): Promise<CustomerVatValidation>;
```

### `pricingApi`

Price list management API for creating and managing customer price lists.

#### `priceList`

`pricingApi.priceList`

```ts
function get(id: string): Promise<CustomerPriceList>;
function list(): Promise<CustomerPriceList[]>;
```

### `wholesaleApi` (Deprecated)

::: warning Deprecated
Use `customersApi` for account management and `pricingApi` for price list operations instead.
:::

#### `account`

`wholesaleApi.account`

```ts
function get(id: string, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function list(options?: WholesaleAccountApiOptions): Promise<WholesaleAccount[]>;
function create(data: WholesaleAccountCreate, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function update(id: string, data: WholesaleAccountUpdate, options?: WholesaleAccountApiOptions): Promise<WholesaleAccount>;
function delete(id: string): Promise<void>;
```

##### `tags`

`wholesaleApi.account.tags`

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

`wholesaleApi.validateVatNumber`

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

#### `me`

`userApi.me`

```ts
function get(): Promise<User>;
function update(id: string, data: UserProfileUpdate): Promise<User>;
```

##### `password`

`userApi.me.password`

```ts
function update(currentPassword: string, newPassword: string): Promise<void>;
```

#### `password`

`userApi.password`

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
  customersApi: ReturnType<typeof repo.customers>;
  pricingApi: ReturnType<typeof repo.pricing>;
  userApi: ReturnType<typeof repo.user>;
  wholesaleApi: ReturnType<typeof repo.wholesale>; // Deprecated
  customerApi: ReturnType<typeof repo.customer>; // Deprecated
}
```
