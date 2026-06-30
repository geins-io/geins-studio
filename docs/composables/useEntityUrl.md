# `useEntityUrl`

The `useEntityUrl` composable provides utility functions for **current-route** entity URLs — it derives everything from the active route path. Use it on entity `[id].vue` / `new` pages, where the route always has a trailing action segment (`new` / `:id`) so the base path is the folder above it.

::: tip
Read more about the concept of entities in Geins MC here: [Entities](/concepts/entities)
:::

::: warning Cross-entity & list URLs come from the registry
For a link to _another_ entity (by key), or from a **list/index page** (which has no trailing segment to derive a base path from), build URLs from the registry instead of this composable:

```ts
import {
  entityBasePath,
  entityListHref,
  entityDetailHref,
} from '#shared/utils/entities';

entityBasePath('price_list'); // "/pricing/price-lists"
entityListHref('price_list'); // "/pricing/price-lists" (the collection index)
entityDetailHref('price_list', '123'); // "/pricing/price-lists/123"
```

These read `ENTITIES[key].route`, the single source of truth, so they can't drift from the folder structure. See [Entities](/concepts/entities#entity-registry-single-source-of-truth).
:::

## Usage (current route)

```ts
const {
  newEntityUrlAlias,
  getEntityName,
  getEntityBasePath,
  getEntityNewUrl,
  getEntityUrl,
} = useEntityUrl();

// On a route like /pricing/price-lists/123:
getEntityName(); // "price_lists" (URL folder — NOT the i18n key)
getEntityBasePath(); // "/pricing/price-lists" (drops the last segment = the index)
getEntityNewUrl(); // "/pricing/price-lists/new"
getEntityUrl('456'); // "/pricing/price-lists/456"
```

## Properties and Methods

### `newEntityUrlAlias`

A localized `computed` for the "new" URL segment. Fetched via `useI18n` with the key `new_entity_url_alias` (`"new"` in `en`, `"ny"` in `sv`). The create page is handled by `[id].vue` matching `route.params.id === newEntityUrlAlias.value`.

### `getEntityName`

```ts
getEntityName(): string
```

Extracts the entity folder name from the current route path (second-to-last segment, dashes → underscores). For **URL building only** — with plural folders it generally does not equal the i18n key (e.g. `companies`, not `company`).

### `getEntityBasePath`

```ts
getEntityBasePath(): string
```

The current entity's base path = the route with its last segment dropped. On an `[id]`/`new` page that is the collection index (e.g. `/pricing/price-lists`).

### `getEntityNewUrl`

```ts
getEntityNewUrl(): string
```

`${getEntityBasePath()}/${newEntityUrlAlias}` — the create URL for the current entity.

### `getEntityUrl`

```ts
getEntityUrl(id: string): string
```

`${getEntityBasePath()}/${id}` — the detail URL for the given id in the current entity.

## Dependencies

1. **`useRoute`** — current route, for context-aware URLs.
2. **`useI18n`** — localization for the `new` alias.

## Type Definitions

```ts
function useEntityUrl(): UseEntityUrlReturnType;

interface UseEntityUrlReturnType {
  newEntityUrlAlias: ComputedRef<string>;
  getEntityName: () => string;
  getEntityBasePath: () => string;
  getEntityNewUrl: () => string;
  getEntityUrl: (id: string) => string;
}
```
