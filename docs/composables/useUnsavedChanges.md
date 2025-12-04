# `useUnsavedChanges`

The `useUnsavedChanges` composable provides tracking and management of unsaved changes in the entity edit interface. It handles navigation guards, user confirmation dialogs, and change detection with configurable field exclusions.

:::tip TIP
This composable is used internally by the [`useEntityEdit`](./useEntityEdit.md) composable, so if you're using that, you may not need to use this directly.
:::

## Features

- **Automatic change detection** by comparing current and original data
- **Navigation guards with confirmation dialog** to prevent accidental data loss
- **Field exclusion** for ignoring specific fields in change detection

## Usage

### Basic Usage

```ts
import type { Product } from '#shared/types';

// Form data
const productData = ref<Product>({
  id: '',
  name: '',
  description: '',
  price: 0,
  category: '',
});

// Original data as JSON string
const originalData = ref('');
const isCreateMode = ref(false);

const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
  useUnsavedChanges(
    productData,
    originalData,
    isCreateMode,
    excludeFields,
    externalChanges,
  );

// Load existing product data
const loadProduct = async (productId: string) => {
  const product = await fetchProduct(productId);
  productData.value = product;
  originalData.value = JSON.stringify(product);
};

// Save changes
const saveProduct = async () => {
  try {
    await updateProduct(productData.value);
    // Update original data after successful save
    originalData.value = JSON.stringify(productData.value);
    showSuccessMessage('Product saved successfully');
  } catch (error) {
    showErrorMessage('Failed to save product');
  }
};
```

## Properties and Methods

### `hasUnsavedChanges`

A `computed` property that indicates whether there are unsaved changes by comparing the current entity data with the original data.

### `unsavedChangesDialogOpen`

A `ref` indicating whether the unsaved changes confirmation dialog is currently open.

### `confirmLeave`

```ts
confirmLeave(): void
```

Used to confirm navigation away from the page when there are unsaved changes. Closes the dialog and allows navigation to proceed.

### `externalChanges`

An optional `ref` that allows external tracking of changes beyond the data comparison. When set to `true`, it will mark the form as having unsaved changes regardless of data comparison. This is useful for tracking changes to related data or complex state that isn't directly reflected in the entity data.

## Type Definitions

```ts
function useUnsavedChanges(
  entityData: Ref<any>,
  originalData: Ref<string>,
  isCreateMode: Ref<boolean>,
  excludeFields?: string[],
  externalChanges?: Ref<boolean>,
): UseUnsavedChangesReturnType;

interface UseUnsavedChangesReturnType {
  hasUnsavedChanges: ComputedRef<boolean>;
  unsavedChangesDialogOpen: Ref<boolean>;
  confirmLeave: () => void;
}
```
