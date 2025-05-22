# `useEntity`

The `useEntity` composable provides utility functions for manipulating entity-related URLs and extracting entity names based on a given `fullPath`. It integrates localization through `useI18n`.

::: tip
Read more about the concept of entities in Geins MC here: [Entities](/concepts/entities)
:::

## Features

- Extracts an entity's name from a full path.
- Constructs URLs for creating a new entity.
- Constructs URLs for editing an entity.
- Supports localization for dynamic URL aliases.

## Usage

Here is how you can use the `useEntity` composable in your project:

```ts
const route = useRoute();
const { newEntityUrlAlias, getEntityName, getNewEntityUrl, getEntityUrl } =
  useEntity(route.fullPath);

const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl();
```

## Parameters

### `fullPath: string`

The full url path of the entity.

For example:  
`/parent/entity/list` or `/parent/entity/1` or `/parent/entity/new`

## Returned Properties and Methods

### `newEntityUrlAlias: string`

A localized string representing the alias for creating a new entity. It is fetched using `useI18n` and the key `new_entity_url_alias`. By default this is set to `new`.

### `getEntityName(): string`

Extracts the entity name from the `fullPath`.

- **Returns**: A string representing the entity name.
- **Example**:  
  For a `fullPath` of `/parent/entity/list`, the result is `entity`.

### `getNewEntityUrl(): string`

Constructs a URL for creating a new entity.

- **Returns**: A string representing the new entity URL.
- **Example**:  
  For a `fullPath` of `/parent/entity/list` and a `newEntityUrlAlias` of `new`, the result is `/parent/entity/new`.

### `getEntityUrl(dataProp: string): string`

Constructs a URL for editing an entity using the provided `dataProp`.

- **Parameters**:

  - `dataProp`: A string representing the identifier or data property of the entity.

- **Returns**: A string representing the edit entity URL.
- **Example**:  
  For a `fullPath` of `/parent/entity/list` and a `dataProp` of `{id}`, the result is `/parent/entity/{id}`. This can then be used to replace `{id}` with the actual identifier of the entity dynamically.

## Dependencies

This composable depends on:

1. **`useI18n`**: Ensures localization support for dynamic URL aliases.
2. **`fullPath`**: A string that must be a valid path, as it is split to extract names and construct URLs.
