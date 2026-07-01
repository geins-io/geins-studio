# Entities

The concept of entities is used throughout the application to dynamically handle various names of content data, such as for example products, categories, users, and more. This allows for a flexible and reusable approach to managing different types of data in the same manner.

## Entity Registry (single source of truth)

A _domain_ entity is known by **three** string forms that must stay in sync:

| Form         | Example               | Used by                                               |
| ------------ | --------------------- | ----------------------------------------------------- |
| **i18n key** | `price_list`          | toasts, 404 titles, empty states, validation messages |
| **endpoint** | `/product/pricelist`  | the repository factory                                |
| **route**    | `pricing/price-lists` | the page folder under `app/pages/`                    |

`shared/utils/entities.ts` reconciles them in one place — the **`ENTITIES`** registry. The registry **key _is_ the i18n key**; its descriptor carries the `endpoint` and (optionally) the `route`. `defineEntities` stamps each entry with its own `key`, so an entry is a complete, self-describing identity — pass `ENTITIES.product` and it knows both its endpoint and its key:

```ts
export const ENTITIES = defineEntities({
  price_list: { endpoint: '/product/pricelist', route: 'pricing/price-lists' },
  quotation: { endpoint: '/quotation', route: 'orders/quotations' },
  channel: { endpoint: '/account/channel', route: 'settings/channels' },
  profile: { route: 'account/profile' }, // singleton — no CRUD endpoint
  // …
});

export type EntityKey = keyof typeof ENTITIES; // 'price_list' | 'quotation' | …
// ENTITIES.price_list === { endpoint: '/product/pricelist', route: 'pricing/price-lists', key: 'price_list' }
```

- **`endpoint`** is omitted for singletons with no standard CRUD endpoint (`profile`, served via `/user/me`). Repositories read it by passing the entry to `repo.entity(ENTITIES.x, fetch)` (see [API Repositories](./api-repositories.md)).
- **`route`** is omitted for sub-entities rendered inside a parent page (`buyer`, `customer`) and entities with no list/`[id]` page (`product`, `message`). It is the one place a route↔i18n-key mismatch (e.g. a plural folder) is reconciled. The route helpers `entityListUrl(key)` / `entityChildPattern(key)` / `entityBasePath(key)` build page URLs from it, so [`navigation.ts`](/composables/) (and any entity link) reads paths from the registry rather than hardcoding them.

Two distinct sets exist, and only the first goes in the registry:

1. **Domain entities** (~13) — have an endpoint + repo + (usually) a route. These are `ENTITIES`. `EntityKey` is derived from them.
2. **Label-only keys** (`name`, `currency`, `owner`, …) — used purely as `entityKey:` interpolation in validation messages and field labels. No endpoint/repo/route. They stay as plain i18n keys (raw string literals at the call site) and are **not** enumerated anywhere — the locale parity test below covers them for free.

> Reference the registry entry (`ENTITIES.x`) or a typed `EntityKey` — never a bare untyped string — so a typo or rename can't silently drift between a repo and its page. Repos and the entity composables (`useEntityEdit`/`usePageError`) take the **entry** (`ENTITIES.x`); pages read `ENTITIES.x.key` (or the `entityKey` the composable returns) for display. `shared/utils/__tests__/entities.test.ts` asserts (a) `en.json` and `sv.json` have **identical keys** (one zero-maintenance check covering every label + entity key), (b) every registry key resolves in both locales, and (c) every `route` resolves to a real page folder.

Used everywhere from the one declaration:

| Consumer    | Reads      | How                                                                                                    |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| repository  | `endpoint` | `repo.entity(ENTITIES.price_list, fetch)`                                                              |
| entity page | the entry  | `useEntityEdit({ entity: ENTITIES.price_list, … })` / `usePageError`                                   |
| navigation  | `route`    | `entityListUrl('price_list')` / `entityEditUrl('price_list', id)` / `entityChildPattern('price_list')` |
| i18n        | key        | `en.json` / `sv.json` (guarded by the parity test)                                                     |

Entity folders are **plural** and the collection lives at the folder **index** (e.g. `/customers/companies`, `/customers/companies/123`, `/customers/companies/new`).

## Entity Pages

The default setup for an entity is that it has its own (plural) folder in the `pages` directory. For example, companies live in `app/pages/customers/companies/`. Inside this folder, you would have the following files:

- `index.vue` — the collection (list) view, served at the folder itself (`/customers/companies`)
- `[id].vue` — a single item in create (`new`) or edit mode

## Entity URL Pattern

The URL pattern for an entity follows the structure `/{parent}/{entity}` for the collection index (list), `/{parent}/{entity}/{id}` for individual items, and `/{parent}/{entity}/new` for the create view.

Where:

- `{parent}` is the parent folder of the entity folders in the `pages` directory
- `{entity}` is the (plural) name of the entity folder itself
- `{id}` is a dynamic parameter that represents the unique identifier of the entity item
- the create segment is the **`NEW_ENTITY_URL_SEGMENT`** constant (default `'new'`); the create page is handled by `[id].vue` matching `route.params.id === NEW_ENTITY_URL_SEGMENT`

### Building entity URLs

All entity URLs come from the registry helpers (pure functions in `shared/utils/entities.ts`) — never hardcode `/domain/entity/...`:

```ts
import {
  entityBasePath,
  entityListUrl,
  entityNewUrl,
  entityEditUrl,
  entityChildPattern,
} from '#shared/utils/entities';

entityListUrl('price_list'); // "/pricing/price-lists" (the collection index)
entityNewUrl('price_list'); // "/pricing/price-lists/new"
entityEditUrl('price_list', '123'); // "/pricing/price-lists/123"
entityChildPattern('price_list'); // "/pricing/price-lists/:id" (nav matching)
```

`useEntityEdit` builds its own `newEntityUrl` / `entityListUrl` from the `entity` it receives, so pages rarely call these directly except on list/index pages and for cross-entity links.

### White-labeling the create segment

To change the create word app-wide (e.g. `/add`, `/create`), set **one** constant:

```ts
// shared/utils/entities.ts
export const NEW_ENTITY_URL_SEGMENT = 'add';
```

`entityNewUrl` and the create-mode check both read it, so nothing else changes.

## Using the entity key for i18n

The entity **key** (`ENTITIES.x.key`, or the `entityKey` string `useEntityEdit` returns) is the parameter for the localized-name i18n keys:

```ts
const entityKey = ENTITIES.price_list.key; // 'price_list'
const { t } = useI18n();

t(entityKey); // "Price list"
t(entityKey, 2); // "Price lists"
t('new_entity', { entityKey }); // "New price list"
t('new_entity', { entityKey }, 2); // "New price lists"
```

## Type Definitions

The entities has some generic type definitions that can be used throughout the application to ensure type safety and consistency when working with entity data.

```ts
export interface EntityBase {
  _id: string;
  _type: string;
}

type CreateEntity<T> = Omit<T, keyof EntityBase>;
type UpdateEntity<T> = Partial<CreateEntity<T>> & Partial<EntityBase>;
type ResponseEntity<T> = T & EntityBase;
```

### Creating Entity Types

When creating a new entity type, you should extend these generic types. First, create a base interface for your type.

```ts
interface ProductBase {
  name: string;
  price: number;
  description?: string;
}
```

Then, create specific types for creating, updating, and receiving the entity.

```ts
type ProductCreate = CreateEntity<ProductBase>;
type ProductUpdate = UpdateEntity<ProductBase>;
type Product = ResponseEntity<ProductBase>;
```

When needed, you should add/remove fields if a type changes in the response versus create/update. For example:

```ts
interface ProductCreate extends CreateEntity<ProductBase> {
  parameters?: string[];
}
interface ProductUpdate extends UpdateEntity<ProductBase> {
  parameters: string[];
}
interface Product extends ResponseEntity<ProductBase> {
  parameters: Parameters[];
}
```
