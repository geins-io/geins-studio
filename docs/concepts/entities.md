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
- **`route`** is omitted for sub-entities rendered inside a parent page (`buyer`, `customer`) and entities with no list/`[id]` page (`product`, `message`). It is the one place a route↔i18n-key mismatch (e.g. a plural folder) is reconciled. The route helpers `entityListHref(key)` / `entityChildPattern(key)` / `entityBasePath(key)` build page URLs from it, so [`navigation.ts`](/composables/) (and any entity link) reads paths from the registry rather than hardcoding them.

Two distinct sets exist, and only the first goes in the registry:

1. **Domain entities** (~13) — have an endpoint + repo + (usually) a route. These are `ENTITIES`. `EntityKey` is derived from them.
2. **Label-only keys** (`name`, `currency`, `owner`, …) — used purely as `entityName:` interpolation in validation messages and field labels. No endpoint/repo/route. They stay as plain i18n keys (raw string literals at the call site) and are **not** enumerated anywhere — the locale parity test below covers them for free.

> Reference the registry entry (`ENTITIES.x`) or a typed `EntityKey` — never a bare untyped string — so a typo or rename can't silently drift between a repo and its page. Repos and the entity composables (`useEntityEdit`/`usePageError`) take the **entry** (`ENTITIES.x`); pages read `ENTITIES.x.key` (or the `entityName` the composable returns) for display. `shared/utils/__tests__/entities.test.ts` asserts (a) `en.json` and `sv.json` have **identical keys** (one zero-maintenance check covering every label + entity key), (b) every registry key resolves in both locales, and (c) every `route` resolves to a real page folder.

Used everywhere from the one declaration:

| Consumer    | Reads      | How                                                                                                        |
| ----------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| repository  | `endpoint` | `repo.entity(ENTITIES.price_list, fetch)`                                                                  |
| entity page | the entry  | `useEntityEdit({ entity: ENTITIES.price_list, … })` / `usePageError`                                       |
| navigation  | `route`    | `entityListHref('price_list')` / `entityDetailHref('price_list', id)` / `entityChildPattern('price_list')` |
| i18n        | key        | `en.json` / `sv.json` (guarded by the parity test)                                                         |

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
- `new` is a localized alias that can be changed in the language files; the create page is handled by `[id].vue` matching `route.params.id === newEntityUrlAlias`

Build these from the registry with `entityBasePath(key)` / `entityListHref(key)` (the index) / `entityDetailHref(key, id)` rather than hardcoding.

## Retrieving the Entity Name

For the **current route**, `useEntityUrl` extracts the entity name from the path:

```javascript
const { getEntityName } = useEntityUrl();
const entityName = getEntityName(); // "products" from "/pim/products/123"
```

::: tip
You can read the full specification of the `useEntityUrl` composable here: [useEntityUrl](/composables/useEntityUrl.md)
:::

::: warning
`getEntityName()` derives the name from the **folder** segment, which (now plural) generally does **not** equal the i18n key — e.g. `companies` → `companies`, not the key `company`. It is for **URL building** only. `useEntityEdit` / `usePageError` instead take the registry entry (`entity: ENTITIES.company`) and derive the key from `entity.key` — so the folder name never matters and the key can't drift from the route.
:::

## Using the Entity Name

The entity name is mainly used as a parameter to a set of language keys to retrieve the correct plural or singular translations for the entity name.

```ts
const { getEntityName, getEntityNewUrl } = useEntityUrl();
const { t } = useI18n();

const entityName = getEntityName(); // "product"

const singular = t(entityName); // "Product"
const plural = t(entityName, 2); // "Products"
const asParamSingular = t('new_entity', { entityName }); // "New Product"
const asParamPlural = t('new_entity', { entityName }, 2); // "New Products"
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
