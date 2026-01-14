# API Repositories

The Geins Studio uses a repository pattern to provide a consistent and type-safe interface for interacting with the Geins API. The repository system is built around a set of factory functions that create specialized API clients for different entity types and domains.

## Repository Structure

The repository files are organized in the `app/utils/repositories/` directory and include:

- `entity-base.ts` - Base repository functions for read operations (get, list)
- `entity.ts` - Full CRUD repository with create, update, and delete operations
- `global.ts` - Repository for system-wide operations (accounts, channels, currencies)
- `product.ts` - Specialized repository for product-related operations
- `customer.ts` - Repository for customer management
- `order.ts` - Repository for order management
- `user.ts` - Repository for user operations

## Using Repositories

The easiest way to access repositories is through the [`useGeinsRepository`](../composables/useGeinsRepository.md) composable, which provides pre-configured instances with the Geins API client automatically injected.

```ts
const { productApi, globalApi, userApi } = useGeinsRepository();

// Get a single product
const product = await productApi.get('product-id');

// List all products
const products = await productApi.list();

// Create a new product
const newProduct = await productApi.create({
  name: 'New Product',
  price: 99.99,
});
```

## Without the composable

You can manually create repository instances by importing the factory functions and passing in your desired API client (e.g., `$geinsApi`).

```ts
import { repo } from '@/utils/repos';
const { $geinsApi } = useNuxtApp();
const productApi = repo.product($geinsApi);
```

With custom client:

```ts
import { repo } from '@/utils/repos';
import { customAPIClient } from 'path-to-client';

const customProductApi = repo.product(customAPIClient);
```

## Repository Types

### Base Repository

The `entityBaseRepo` provides basic read operations for any entity type:

```ts
const baseRepo = entityBaseRepo<Product, ProductApiOptions>(
  '/product',
  $geinsApi,
);

// Available methods:
await baseRepo.get(id, options);
await baseRepo.list(options);
```

For simple repositories that only need one operation, you can use the individual factory functions:

```ts
// Repository with only get operation
const getRepo = entityGetRepo<Product, ProductApiOptions>(
  '/product',
  $geinsApi,
);
await getRepo.get(id, options);

// Repository with only list operation
const listRepo = entityListRepo<Product, ProductApiOptions>(
  '/product',
  $geinsApi,
);
await listRepo.list(options);
```

### Full Entity Repository

The `entityRepo` extends the base repository with full CRUD operations:

```ts
const fullRepo = entityRepo<Product, ProductCreate, ProductUpdate>(
  '/product',
  $geinsApi,
);

// Available methods:
await fullRepo.get(id, options);
await fullRepo.list(options);
await fullRepo.create(data, options);
await fullRepo.update(id, data, options);
await fullRepo.delete(id);
```

## Type Definitions

Repositories use generic types to ensure type safety across all operations:

```ts
function entityRepo<
  TResponse,
  TCreate,
  TUpdate,
  TOptions = Record<string, any>,
>(
  endpoint: string,
  fetch: $Fetch,
): EntityRepository<TResponse, TCreate, TUpdate, TOptions>;

// Generic repository types
type EntityRepository<TResponse, TCreate, TUpdate, TOptions> = {
  get(id: string, options?: TOptions): Promise<TResponse>;
  list(options?: TOptions): Promise<TResponse[]>;
  create(data: TCreate, options?: TOptions): Promise<TResponse>;
  update(id: string, data: TUpdate, options?: TOptions): Promise<TResponse>;
  delete(id: string): Promise<void>;
};
```

## Adding a New Entity Repository

To create a repository for a new entity type:

1. **Define your entity types** in the shared types:

```ts
// In shared/types/
interface ArticleBase {
  title: string;
  content: string;
  publishedAt?: Date;
}

type ArticleCreate = CreateEntity<ArticleBase>;
type ArticleUpdate = UpdateEntity<ArticleBase>;
type Article = ResponseEntity<ArticleBase>;
```

:::tip TIP
Read more about entity types in the [Entitites](./entities.md) docs.
:::

2. **Create the repository file**:

```ts
// In app/utils/repositories/article.ts
import { entityRepo } from './entity';

const BASE_ENDPOINT = '/article';

export function articleRepo(fetch: $Fetch) {
  return entityRepo<Article, ArticleCreate, ArticleUpdate>(
    BASE_ENDPOINT,
    fetch,
  );
}
```

3. **Register in the main repo object**:

```ts
// In app/utils/repos.ts
import { articleRepo } from './repositories/article';

export const repo = {
  // ...existing repos
  article: articleRepo,
};
```

4. **Add to the useGeinsRepository composable**:

```ts
// In app/composables/useGeinsRepository.ts
interface UseGeinsRepositoryReturnType {
  // ...existing properties
  articleApi: ReturnType<typeof repo.article>;
}

export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  return {
    // ...existing repos
    articleApi: repo.article($geinsApi),
  };
}
```

::: tip
The repository pattern ensures consistent API interactions and provides excellent TypeScript support. All repositories automatically handle authentication, error handling, and request/response serialization through the underlying Geins API client.
:::
