# `FormInputTagsSearch`

`FormInputTagsSearch` is the base multi-value tag picker: a `TagsInput` plus combobox dropdown for adding tags from a dataset, with an opt-in path for free-text custom tags. Generic over any item that extends `EntityBaseWithName`. [`FormInputChannels`](/components/form/input/FormInputChannels) is the canonical wrapper.

## Features

- Multi-select with chip rendering inside the input
- Searchable dataset filter via reka-ui `useFilter` (case-insensitive)
- Optional custom-tag mode (`allowCustomTags`) — adds whatever the user typed when no match
- Slot for custom tag rendering (e.g. flag, color swatch) and for custom item rendering in the dropdown
- Portaled dropdown with `disableTeleport` escape hatch
- Closes dropdown on Tab to allow keyboard navigation onward
- `string[]` model bound via `defineModel<string[]>()`

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const selectedIds = ref<string[]>([]);
const channels = await fetchChannels();
</script>

<template>
  <FormInputTagsSearch
    v-model="selectedIds"
    :data-set="channels"
    entity-name="channel"
  />
</template>
```

### Custom tag rendering

```vue
<template>
  <FormInputTagsSearch
    v-model="selectedIds"
    :data-set="markets"
    entity-name="market"
  >
    <template #tag="{ item }">
      <span class="flex items-center gap-1.5">
        <span :class="flagClass(item?.country?._id)" class="size-3 rounded-full" />
        <TagsInputItemText />
      </span>
    </template>
  </FormInputTagsSearch>
</template>
```

### Allow free-text tags

```vue
<template>
  <FormInputTagsSearch
    v-model="labels"
    :data-set="presetLabels"
    entity-name="label"
    allow-custom-tags
  />
</template>
```

## Props

### `dataSet`

```ts
dataSet?: T[]   // T extends EntityBaseWithName
```

Items the user can pick. Each must have `_id` and either `displayName` or `name`.

### `entityName`

```ts
entityName?: string
```

i18n key for placeholders ("Add channel…", "No channels", etc.).

### `placeholder`

```ts
placeholder?: string
```

Override the auto-generated placeholder.

### `allowCustomTags`

```ts
allowCustomTags?: boolean
```

When `true`, surfaces an `Add: {typed value}` item when no dataset match exists, and adds the raw string as a tag on select.

- **Default:** `false`

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline instead of portaled to `body`.

- **Default:** `false`

## v-model

### default

```ts
v-model: string[]
```

Array of selected item ids (or raw strings when `allowCustomTags` is on).

## Slots

### `tag`

Custom rendering inside each chip. Slot prop: `{ item: T | undefined }`.

### `item`

Custom rendering for each dropdown row. Slot prop: `{ item: T }`.

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`, `useFilter`
- shadcn-vue `TagsInput`, `TagsInputItem`, `TagsInputInput`, `TagsInputItemDelete`
- `getEntityNameById` utility
