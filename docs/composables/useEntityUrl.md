# `useEntityUrl`

The `useEntityUrl` composable provides utility functions for manipulating entity-related URLs and extracting entity names from the current route. It integrates localization through `useI18n` and supports both context-aware and entity-specific URL generation.

::: tip
Read more about the concept of entities in Geins MC here: [Entities](/concepts/entities)
:::

## Features

- Extracts an entity's name from the current route path
- Constructs URLs for creating a new entity (current context)
- Constructs URLs for editing an entity (current context)
- Constructs URLs for entity list pages (current context)
- Generates URLs for any entity from anywhere in the application
- Supports localization for dynamic URL aliases

## Usage

Here are the different ways you can use the `useEntityUrl` composable:

### Context-Aware Usage (Current Route)

```ts
// Automatically uses the current route
const {
  newEntityUrlAlias,
  getEntityName,
  getEntityBasePath,
  getEntityNewUrl,
  getEntityUrl,
  getEntityListUrl,
} = useEntityUrl();

const entityName = getEntityName(); // "product" from "/pim/product/list"
const entityBasePath = getEntityBasePath(); // "/pim/product"
const newEntityUrl = getEntityNewUrl(); // "/pim/product/new"
const editUrl = getEntityUrl('123'); // "/pim/product/123"
const listUrl = getEntityListUrl(); // "/pim/product/list"
```

### Entity-Specific Usage (Any Entity)

```ts
// Generate URLs for any entity from anywhere
const { getEntityNewUrlFor, getEntityListUrlFor } = useEntityUrl();

// Generate URLs for different entities
const productListUrl = getEntityListUrlFor('product', 'pim'); // "/pim/product/list"
const userNewUrl = getEntityNewUrlFor('user', 'account'); // "/account/user/new"
```

### Navigation Component Usage

```ts
const { getEntityListUrlFor } = useEntityUrl();

const navigationItems = [
  { name: 'Products', url: getEntityListUrlFor('product', 'pim') },
  { name: 'Users', url: getEntityListUrlFor('user', 'account') },
  { name: 'Orders', url: getEntityListUrlFor('order', 'wholesale') },
];
```

## Properties and Methods

### `newEntityUrlAlias`

A localized `computed` reference representing the alias for creating a new entity. It is fetched using `useI18n` and the key `new_entity_url_alias`. By default this is set to `"new"`.

### `listEntityUrlAlias`

A localized `computed` reference representing the alias for entity list pages. It is fetched using `useI18n` and the key `list_entity_url_alias`. By default this is set to `"list"`.

### `getEntityName`

```ts
getEntityName(): string
```

Extracts the entity name from the current route path.

- **Returns**: A string representing the entity name.
- **Example**:  
  For a current route of `/pim/product/list`, the result is `"product"`.

### `getEntityNewUrl`

```ts
getEntityNewUrl(): string
```

Constructs a URL for creating a new entity based on the current route.

- **Returns**: A string representing the new entity URL.
- **Example**:  
  For a current route of `/pim/product/list`, the result is `/pim/product/new`.

### `getEntityUrl`

```ts
getEntityUrl(id: string): string
```

Constructs a URL for editing a specific entity based on the current route.

- **Parameters**:
  - `id`: A string representing the identifier of the entity.

- **Returns**: A string representing the edit entity URL.
- **Example**:  
  For a current route of `/pim/product/list` and an `id` of `"123"`, the result is `/pim/product/123`.

### `getEntityListUrl`

```ts
getEntityListUrl(): string
```

Constructs a URL for the entity list page based on the current route.

- **Returns**: A string representing the entity list URL.
- **Example**:  
  For a current route of `/pim/product/new`, the result is `/pim/product/list`.

### `getEntityNewUrlFor`

```ts
getEntityNewUrlFor(targetEntityName: string, targetParent: string): string
```

Constructs a URL for creating a new entity for any entity type.

- **Parameters**:
  - `targetEntityName`: The name of the entity (e.g., "product", "user")
  - `targetParent`: The parent path segment (e.g., "pim", "account")

- **Returns**: A string representing the new entity URL.
- **Example**:  
  `getEntityNewUrlFor("product", "pim")` returns `/pim/product/new`.

### `getEntityListUrlFor`

```ts
getEntityListUrlFor(targetEntityName: string, targetParent: string): string
```

Constructs a URL for the entity list page for any entity type.

- **Parameters**:
  - `targetEntityName`: The name of the entity (e.g., "product", "user")
  - `targetParent`: The parent path segment (e.g., "pim", "account")

- **Returns**: A string representing the entity list URL.
- **Example**:  
  `getEntityListUrlFor("user", "account")` returns `/account/user/list`.

## Dependencies

This composable depends on:

1. **`useRoute`**: Uses the current route to extract entity information and construct context-aware URLs.
2. **`useI18n`**: Ensures localization support for dynamic URL aliases like "new" and "list".

## URL Pattern

The composable follows this URL pattern:

- **List**: `/{parent}/{entity}/list`
- **New**: `/{parent}/{entity}/new`
- **Edit**: `/{parent}/{entity}/{id}`

Where:

- `parent` is the parent route segment (e.g., "pim", "account", "wholesale")
- `entity` is the entity name (e.g., "product", "user", "pricelist")
- `id` is the specific entity identifier

## Type Definitions

```ts
function useEntityUrl(): UseEntityUrlReturnType;

interface UseEntityUrlReturnType {
  newEntityUrlAlias: ComputedRef<string>;
  listEntityUrlAlias: ComputedRef<string>;
  getEntityName: () => string;
  getEntityBasePath: () => string;
  getEntityNewUrl: () => string;
  getEntityUrl: (id: string) => string;
  getEntityListUrl: () => string;
  getEntityNewUrlFor: (entityName: string, targetParent: string) => string;
  getEntityListUrlFor: (entityName: string, targetParent: string) => string;
}
```
