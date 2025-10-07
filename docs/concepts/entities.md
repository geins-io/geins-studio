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

### Context-Aware Usage (Current Entity Page)

```vue
<script setup>
const { getEntityName, getEntityNewUrl } = useEntityUrl();
const entityName = getEntityName();
const newEntityUrl = getEntityNewUrl();
</script>
<template>
  <ButtonIcon icon="new" :href="newEntityUrl">
    {{ $t('new_entity', { entityName }) }}
  </ButtonIcon>
</template>
```

### Cross-Entity Navigation

The composable also supports generating URLs for any entity from anywhere in the application:

```vue
<script setup>
const { getEntityListUrlFor, getEntityNewUrlFor } = useEntityUrl();

// Generate navigation links for different entities
const navigationItems = [
  {
    name: 'Products',
    listUrl: getEntityListUrlFor('product', 'pim'),
    newUrl: getEntityNewUrlFor('product', 'pim'),
  },
  {
    name: 'Users',
    listUrl: getEntityListUrlFor('user', 'account'),
    newUrl: getEntityNewUrlFor('user', 'account'),
  },
];
</script>
<template>
  <nav>
    <div v-for="item in navigationItems" :key="item.name">
      <NuxtLink :to="item.listUrl">{{ item.name }}</NuxtLink>
      <ButtonIcon icon="new" :href="item.newUrl">
        {{ $t('new_entity', { entityName: item.name.toLowerCase() }) }}
      </ButtonIcon>
    </div>
  </nav>
</template>
```
