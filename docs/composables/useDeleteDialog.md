# `useDeleteDialog`

The `useDeleteDialog` composable provides a standardized way to handle delete operations with user confirmation dialogs. It manages the dialog state, loading indicators, and optional navigation after successful deletion.

## Features

- **Confirmation dialog management** with reactive state
- **Loading state tracking** during delete operations
- **Optional navigation** after successful deletion

## Usage

### Basic Usage

```ts
// Define your delete action
const deleteProduct = async (): Promise<boolean> => {
  try {
    await productApi.delete(productId.value);
    return true; // Indicates successful deletion
  } catch (error) {
    console.error('Failed to delete product:', error);
    return false; // Indicates failed deletion
  }
};

// Use the composable
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteProduct);
```

## Parameters

### `deleteAction`

```ts
deleteAction: () => Promise<boolean>;
```

A function that performs the actual delete operation. Must return a Promise that resolves to:

- `true` if the deletion was successful
- `false` if the deletion failed

### `successRedirectUrl` (optional)

```ts
successRedirectUrl?: string
```

An optional URL to navigate to after successful deletion. If provided, the user will be redirected to this URL when the delete operation succeeds.

## Properties and Methods

### `deleteDialogOpen`

A `ref` indicating whether the delete confirmation dialog is currently open.

### `deleting`

A `ref` indicating whether a delete operation is currently in progress. Useful for showing loading indicators.

### `openDeleteDialog`

```ts
openDeleteDialog(): Promise<void>
```

Opens the delete confirmation dialog. Uses `nextTick()` to ensure proper DOM updates before showing the dialog.

### `confirmDelete`

```ts
confirmDelete(): Promise<void>
```

Executes the delete operation by calling the provided `deleteAction`.

**Behavior:**

1. Sets `deleting` to `true`
2. Calls the `deleteAction` function
3. If successful and `successRedirectUrl` is provided, navigates to that URL
4. Sets `deleting` to `false`
5. Closes the dialog by setting `deleteDialogOpen` to `false`

## Type Definitions

```ts
function useDeleteDialog(
  deleteAction: () => Promise<boolean>,
  successRedirectUrl?: string,
): UseDeleteDialogReturnType;

interface UseDeleteDialogReturnType {
  deleteDialogOpen: Ref<boolean>;
  deleting: Ref<boolean>;
  openDeleteDialog: () => Promise<void>;
  confirmDelete: () => Promise<void>;
}
```
