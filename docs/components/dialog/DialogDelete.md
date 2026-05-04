# `DialogDelete`

`DialogDelete` is the standard confirmation dialog for destructive entity actions — wired into the unified delete flow used across edit pages and list-page row actions.

## Features

- Pre-localized title and description via `dialog.delete_confirm_title` / `dialog.delete_confirm_description`
- Entity name interpolation through the `entityName` i18n key
- Loading state on the destructive confirm button
- Two-way `open` binding via `v-model:open`

## Usage

### Basic Usage

Most pages don't instantiate this directly — they use [`useDeleteDialog`](/composables/useDeleteDialog) which wires the dialog and handler together. To use it standalone:

```vue
<script setup lang="ts">
const open = ref(false);
const loading = ref(false);

const onConfirm = async () => {
  loading.value = true;
  await deleteEntity();
  loading.value = false;
  open.value = false;
};
</script>

<template>
  <DialogDelete
    v-model:open="open"
    entity-name="quotation"
    :loading="loading"
    @confirm="onConfirm"
    @cancel="open = false"
  />
</template>
```

## Props

### `entityName`

```ts
entityName: string
```

The i18n key for the entity name (e.g. `'quotation'`, `'company'`). Interpolated into the dialog description.

- **Required:** yes

### `loading`

```ts
loading: boolean
```

Disables the confirm button and shows a spinner while the delete request is in flight.

- **Required:** yes

## v-model

### `open`

```ts
v-model:open: boolean
```

Controls dialog visibility. `defineModel('open')` — bind with `v-model:open`.

- **Default:** `false`

## Events

### `confirm`

Emitted when the user clicks the destructive confirm button. The handler is responsible for toggling `loading` and closing the dialog.

### `cancel`

Emitted when the user clicks Cancel. Typically used to close the dialog (`open = false`).

## Dependencies

- shadcn-vue [`AlertDialog`](/components/shadcn-vue) — visual primitive
- [`useDeleteDialog`](/composables/useDeleteDialog) — recommended wrapper that owns state and handler wiring
