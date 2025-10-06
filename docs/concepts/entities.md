# Entities

The concept of entities is used throughout the application to dynamically handle various names of content data, such as for example products, categories, users, and more. This allows for a flexible and reusable approach to managing different types of data in the same manner.

## Entity Pages

The default setup for an entity is that it has it's own folder in the `pages` directory. For example, the entity `product` would have a folder named `product` in it's parents folder (in this case `pim`) inside the `pages` directory. Inside this folder, you would have the following files:

- `[id].vue`
- `list.vue`

The `[id].vue` file is used to dynamically display a single entity item in create or edit mode, while the `list.vue` file is used to display a list of all entities of that type in a data table.

## Entity URL Pattern

The URL pattern for an entity always follows the structure `/[parent]/[entity]/[id]` for individual items, `/[parent]/[entity]/list` for the list view and `/[parent]/[entity]/new` for the create view. The `[parent]` is the parent folder of the entity folder in the `pages` directory. The `[entity]` is the name of the entity itself. The `[id]` is a dynamic parameter that represents the unique identifier of the entity item. `list` and `new` are localized aliases that can be changed in the language files.

## Retrieving the Entity Name

The entity name is typically retrieved using the `useEntityUrl` composable. This composable extracts the entity name from the current route path.
For example, if the current route path is `/pim/product/list`, the entity name would be `product`.

```javascript
const route = useRoute();
const { getEntityName } = useEntityUrl(route.fullPath);
const entityName = getEntityName();
```

::: tip
You can read the full specification of the `useEntityUrl` composable here: [useEntityUrl](/composables/useEntityUrl.md)
:::

## Using the Entity Name

The entity name is mainly used as param to a set of language keys to retrieve the correct plural or singular translations for the entity name.

```vue
<script setup>
const { getEntityName, getEntityNewUrl } = useEntityUrl(route.fullPath);
const entityName = getEntityName();
const newEntityUrl = getEntityNewUrl();
</script>
<template>
  <ButtonIcon icon="new" :href="newEntityUrl">
    {{ $t('new_entity', { entityName }) }}
  </ButtonIcon>
</template>
```
