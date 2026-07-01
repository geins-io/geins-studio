# `FormInputTagsSearch`

`FormInputTagsSearch` is the base multi-value tag picker: a `TagsInput` plus combobox dropdown for adding tags from a dataset, with an opt-in path for free-text custom tags. Generic over any item that extends `EntityBaseWithName`. [`FormInputChannels`](/components/form/input/FormInputChannels) is the canonical wrapper.

## Features

- Multi-select with chip rendering inside the input
- Optional single-select mode (`singleSelect`) — caps at one tag, hides the search input + its placeholder once filled, and uses a singular placeholder
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
    entity-key="channel"
  />
</template>
```

### Custom tag rendering

```vue
<template>
  <FormInputTagsSearch
    v-model="selectedIds"
    :data-set="markets"
    entity-key="market"
  >
    <template #tag="{ item }">
      <span class="flex items-center gap-1.5">
        <span
          :class="flagClass(item?.country?._id)"
          class="size-3 rounded-full"
        />
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
    entity-key="label"
    allow-custom-tags
  />
</template>
```

### Single selection

```vue
<script setup lang="ts">
// Model stays string[] — it just never holds more than one item.
const selectedIds = ref<string[]>([]);
</script>

<template>
  <FormInputTagsSearch
    v-model="selectedIds"
    :data-set="groups"
    entity-key="group"
    single-select
  />
</template>
```

Caps the picker at one tag. Once a tag is selected the search input — and its singular `Add group…` placeholder — is hidden; delete the tag to pick a different one. To bind a single `string` field (rather than `string[]`), wrap the model: `:model-value="value ? [value] : []"` and set the field to `val[0] ?? ''` on update (see the workflow `group` field in `app/pages/orchestrator/workflows/[id].vue`).

## Props

### `dataSet`

```ts
dataSet?: T[]   // T extends EntityBaseWithName
```

Items the user can pick. Each must have `_id` and either `displayName` or `name`.

### `entityKey`

```ts
entityKey?: string
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

### `singleSelect`

```ts
singleSelect?: boolean
```

Restrict to a single selection: caps at one tag (`TagsInput :max="1"`), hides the search input and its `Add …` placeholder once a tag is selected, and renders the placeholder in singular form (`Add group…` rather than `Add groups…`). The model is still `string[]` — it just never holds more than one item.

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

Array of selected item ids (or raw strings when `allowCustomTags` is on). In `singleSelect` mode the array holds 0 or 1 items.

## Slots

### `tag`

Custom rendering inside each chip. Slot prop: `{ item: T | undefined }`.

### `item`

Custom rendering for each dropdown row. Slot prop: `{ item: T }`.

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`, `useFilter`
- shadcn-vue `TagsInput`, `TagsInputItem`, `TagsInputInput`, `TagsInputItemDelete`
- `getEntityNameById` utility
