# `DialogUnsavedChanges`

`DialogUnsavedChanges` is the shared "discard changes?" dialog used by every entity edit page. Without it the route guard in [`useEntityEdit`](/composables/useEntityEdit) silently blocks navigation with no UI — every edit page must include it.

## Features

- Pre-localized title and description (`dialog.unsaved_changes_title` / `dialog.unsaved_changes_description`)
- Loading state on the destructive confirm button
- Two-way `open` binding via `v-model:open`

## Usage

### Basic Usage

`useEntityEdit` exposes `unsavedChangesDialog` state and handlers — wire them once per edit page:

```vue
<script setup lang="ts">
const {
  entityDataUpdate,
  unsavedChangesDialog,
  confirmUnsavedChanges,
  cancelUnsavedChanges,
} = useEntityEdit({ /* … */ });
</script>

<template>
  <!-- … edit page content … -->
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialog.open"
    entity-name="quotation"
    :loading="unsavedChangesDialog.loading"
    @confirm="confirmUnsavedChanges"
    @cancel="cancelUnsavedChanges"
  />
</template>
```

> [!WARNING]
> Omitting `<DialogUnsavedChanges>` from an entity edit page leaves the route guard active with nothing to render — the page appears stuck with no error and no dialog.

## Props

### `entityName`

```ts
entityName: string
```

Reserved for future copy interpolation. Currently the localized strings don't reference it but the prop is required for parity with [`DialogDelete`](/components/dialog/DialogDelete).

- **Required:** yes

### `loading`

```ts
loading: boolean
```

Disables the confirm button and shows a spinner while the discard navigation runs.

- **Required:** yes

## v-model

### `open`

```ts
v-model:open: boolean
```

Controls dialog visibility.

- **Default:** `false`

## Events

### `confirm`

Emitted when the user clicks Continue. `useEntityEdit.confirmUnsavedChanges` performs the navigation.

### `cancel`

Emitted when the user clicks Cancel. `useEntityEdit.cancelUnsavedChanges` resets state.

## Dependencies

- shadcn-vue [`AlertDialog`](/components/shadcn-vue) — visual primitive
- [`useEntityEdit`](/composables/useEntityEdit) — owns dialog state and navigation handler
