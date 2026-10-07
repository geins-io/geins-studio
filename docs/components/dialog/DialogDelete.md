# `DialogDelete`

`DialogDelete` is the standard confirmation dialog for destructive entity actions — wired into the unified delete flow used across edit pages and list-page row actions.

## Features

- Pre-localized title, description and confirm button via `dialog.delete_confirm_title` / `dialog.delete_confirm_description` / `continue`, each with an optional per-entity override (`title`, `description`, `confirmLabel`, `confirmVariant`)
- Entity name interpolation through the `entityKey` i18n key
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
    entity-key="quotation"
    :loading="loading"
    @confirm="onConfirm"
    @cancel="open = false"
  />
</template>
```

### Soft delete (move to trash)

A soft delete overrides the copy and drops the red button, so nothing in the dialog claims permanence. The asset library does this — see [assets → Delete vocabulary](/domains/assets#delete-vocabulary):

```vue
<DialogDelete
  v-model:open="open"
  entity-key="asset"
  :loading="loading"
  :title="$t('asset_library.trash_confirm_title')"
  :description="
    $t('asset_library.trash_restore_note', { days: TRASH_RETENTION_DAYS }, 1)
  "
  :confirm-label="$t('asset_library.move_to_trash')"
  confirm-variant="default"
  @confirm="onConfirm"
/>
```

## Props

### `entityKey`

```ts
entityKey: string;
```

The i18n key for the entity name (e.g. `'quotation'`, `'company'`). Interpolated into the dialog description.

- **Required:** yes

### `loading`

```ts
loading: boolean;
```

Disables the confirm button and shows a spinner while the delete request is in flight.

- **Required:** yes

### `title`

```ts
title?: string;
```

Replaces the default title (`dialog.delete_confirm_title`, "Are you absolutely sure?"). Pass an already-translated string.

- **Required:** no

### `description`

```ts
description?: string;
```

Replaces the default confirm line (`dialog.delete_confirm_description`). Use it when the default's permanence claim — "permanently delete … cannot be undone" — isn't true for the entity, e.g. an asset, where the backend soft-deletes to trash. Pass an already-translated string.

- **Required:** no

### `confirmLabel`

```ts
confirmLabel?: string;
```

Replaces the confirm button's default label (`continue`). Pass an already-translated string.

- **Required:** no

### `confirmVariant`

```ts
confirmVariant?: ButtonVariants['variant'];
```

The confirm button's variant. Defaults to `destructive`; pass `default` for a recoverable action such as move to trash.

- **Required:** no

### `warningTitle` / `warningDescription`

```ts
warningTitle?: string;
warningDescription?: string;
```

Optional caution callout rendered as a `Feedback` (warning style) between the description and the footer — e.g. warning that an asset used in several places will be removed from all of them. `warningTitle` gates rendering; pass both for the full title + description. Omit for the plain confirm.

- **Required:** no

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
