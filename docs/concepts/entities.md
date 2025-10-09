# Entities

The concept of entities is used throughout the application to dynamically handle various names of content data, such as for example products, categories, users, and more. This allows for a flexible and reusable approach to managing different types of data in the same manner.

## Entity Pages

The default setup for an entity is that it has it's own folder in the `pages` directory. For example, the entity `product` would have a folder named `product` in it's parents folder (in this case `pim`) inside the `pages` directory. Inside this folder, you would have the following files:

- `[id].vue`
- `list.vue`

The `[id].vue` file is used to dynamically display a single entity item in create or edit mode, while the `list.vue` file is used to display a list of all entities of that type in a data table.

## Entity URL Pattern

The URL pattern for an entity always follows the structure `/{parent}/{entity}/{id}` for individual items, `/{parent}/{entity}/list` for the list view and `/{parent}/{entity}/new` for the create view.

Where:

- `{parent}` is the parent folder of the entity folders in the `pages` directory
- `{entity}` is the name of the entity itself
- `{id}` is a dynamic parameter that represents the unique identifier of the entity item
- `list` and `new` are localized aliases that can be changed in the language files

## Retrieving the Entity Name

The entity name is typically retrieved using the `useEntityUrl` composable. This composable automatically extracts the entity name from the current route path without requiring any parameters.

For example, if the current route path is `/pim/product/list`, the entity name would be `product`.

```javascript
const { getEntityName } = useEntityUrl();
const entityName = getEntityName(); // "product"
```

::: tip
You can read the full specification of the `useEntityUrl` composable here: [useEntityUrl](/composables/useEntityUrl.md)
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
