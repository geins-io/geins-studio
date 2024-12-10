# Entities

The concept of entities is used throughout the application to dynamically handle various names of content data, such as for example products, categories, users, and more. This allows for a flexible and reusable approach to managing different types of data in the same manner.

## Entity Pages

The default setup for an entity is that it has it's own folder in the `pages` directory. For example, the entity `product` would have a folder named `product` in it's parents folder (in this case `pim`) inside the `pages` directory. Inside this folder, you would have the following files:

- `[id].vue`
- `list.vue`

The `[id].vue` file is used to dynamically display a single entity item in create or edit mode, while the `list.vue` file is used to display a list of all entities of that type in a data table.

## Retrieving the Entity Name

The entity name is typically retrieved using the `useEntity` composable. This composable extracts the entity name from the current route path.
For example, if the current route path is `/pim/product/list`, the entity name would be `product`.

```javascript
const route = useRoute();
const { getEntityName } = useEntity(route.fullPath);
const entityName = getEntityName();
```

::: tip
You can read the full specification of the `useEntity` composable here: [useEntity](/composables/useEntity.md)
:::

## Using the Entity Name

The entity name is mainly used as param to a set of language keys to retrieve the correct plural or singular translations for the entity name.

```vue
<script setup>
const { getEntityName, getNewEntityUrl } = useEntity(route.fullPath);
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
</script>
<template>
  <ButtonNew :href="newEntityUrl">
    {{ $t('new_entity', { entityName }) }}
  </ButtonNew>
</template>
```

## Creating a new entity

Say you wanna create a new page where you list all books. You can easily do so by running our built-in CLI command:

```bash
npx create-entity
```

This will prompt you about the name of the entity you want to create, and then create the necessary basic `[id].vue` and `list.vue` files for you. It will also ask you to provide the singular and plural english translations for the entity name, which will be added to the language file.

That's it, now you just have to connect your files to the API and you're good to go!

::: warning
This feature is not yet fully implemented
:::
