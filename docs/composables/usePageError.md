# `usePageError`

The `usePageError` composable provides utility functions for handling errors in any page, with optional support for entity-specific error messages. It integrates localization through `useI18n` and provides consistent error handling with proper status codes and user feedback.

## Features

- Throws fatal errors that navigate to the error page
- Shows non-fatal error toast notifications
- Supports entity-specific error messages with i18n
- Automatically generates contextual error messages based on status codes

## Usage

Here are the different ways you can use the `usePageError` composable:

### Basic Usage

```ts
const { handleFetchResult } = usePageError();
const { data, error } = await useAsyncData(() => productApi.list());
onMounted(() => {
  // One-liner error handling + validation
  const product = handleFetchResult<Product[]>(error.value, data.value);
});
```

### For entity edit page

```ts
// For entity edit pages
// Will show contextual 404 error like "Couldn't not find product with ID 123"
const { handleFetchResult } = usePageError({
  entityName: 'product',
  entityId: '123',
});

const { data, error } = await useAsyncData(() => productApi.get(id));

onMounted(() => {
  // One-liner error handling + validation
  // Returns the validated data or throws appropriate error
  const product = handleFetchResult<Product>(error.value, data.value);
});
```

### For non-fatal errors

```ts
const { showErrorToast } = usePageError();
try {
  await productApi.update(id, data);
} catch (error) {
  // Show toast instead of navigating away
  await showErrorToast('Failed to update product', 'Please try again later.');
}
```

## Properties and Methods

### `throwPageError`

```ts
throwPageError(
  statusCodeOrError?: number | NuxtError,
  contextOptions?: PageErrorOptions
): never
```

**Used internally by `handleFetchResult`**. Throws a fatal error that navigates the user to the appropriate error page. Can accept either a status code or an error object.

- **Parameters**:
  - `statusCodeOrError`: HTTP status code (defaults to 404) or NuxtError object
  - `contextOptions`: Optional override for error context (entityName, entityId)

- **Returns**: Never returns (throws error)

### `showErrorToast`

```ts
showErrorToast(customTitle?: string, customDescription?: string): Promise<void>
```

Shows a non-fatal error toast notification instead of navigating to an error page.

- **Parameters**:
  - `customTitle`: Optional custom error message (overrides default)
  - `customDescription`: Optional custom description message (overrides default)

- **Returns**: Promise that resolves when toast is shown

### `validateData`

```ts
validateData<T>(
  data: T | null | undefined,
  customOptions?: PageErrorOptions
): NonNullable<T>
```

**Used internally by `handleFetchResult`**. Validates that data exists (not null/undefined), throwing a 404 error if validation fails. Returns the data with TypeScript null/undefined removed from type.

- **Parameters**:
  - `data`: Data to validate (can be null or undefined)
  - `customOptions`: Optional override for error context

- **Returns**: The validated data with non-nullable type

### `handleFetchResult`

```ts
handleFetchResult<T>(
  error: NuxtError | undefined,
  data: T | null | undefined,
  customOptions?: PageErrorOptions
): NonNullable<T>
```

Combines error handling and data validation in one call. Throws error if present, validates data exists, and returns validated data.

- **Parameters**:
  - `error`: Error from useAsyncData or API call
  - `data`: Data to validate
  - `customOptions`: Optional override for error context

- **Returns**: The validated data with non-nullable type

- **Examples**:

```ts
const { handleFetchResult } = usePageError({
  entityName: 'price_list',
  entityId: id,
});

// One-liner error handling + validation
const { data, error } = await useAsyncData(() => productApi.priceList.get(id));
const priceList = handleFetchResult(error.value, data.value);

// With context override
const { data: productData, error: productError } = await useAsyncData(() =>
  productApi.product.get(productId),
);
const product = handleFetchResult(productError.value, productData.value, {
  entityName: 'product',
  entityId: productId,
});
```

## Architecture overview

```
User request → Entity or list page
                     ↓
                useAsyncData()
                     ↓
        Error occurs or data missing?
                     ↓
          ┌──────────┴──────────┐
          ↓                     ↓
      Fatal error         Non-fatal error
      (404, 500)        (update/create failure)
          ↓                     ↓
    handleFetchError()    showEntityErrorToast()
          ↓                     ↓
      error.vue            Toast notification
          ↓                     ↓
    Error404/Error500     User stays on page
```

## Error message priority

The composable uses the following priority for generating error messages:

1. **Entity with ID** (`entityName` + `entityId` provided in options or context)
2. **Entity only** (`entityName` provided)
3. **Generic messages** (fallback)

### Status code handling

- **404**: Uses entity-specific "not found" messages or generic 404 message
- **500+**: Uses entity-specific "error loading" message or generic 500 message
- **Other codes**: Uses entity-specific "error loading" message or generic 500 message

## Type Definitions

```ts
function usePageError(options?: PageErrorOptions): UsePageErrorReturnType;

interface PageErrorOptions {
  entityName?: string;
  entityId?: string;
  entityList?: boolean;
}

interface UsePageErrorReturnType {
  throwPageError: (
    statusCodeOrError?: number | NuxtError,
    contextOptions?: PageErrorOptions,
  ) => never;
  showErrorToast: (
    customTitle?: string,
    customDescription?: string,
  ) => Promise<void>;
  validateData: <T>(
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ) => NonNullable<T>;
  handleFetchResult: <T>(
    error: NuxtError | undefined,
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ) => NonNullable<T>;
}
```

## Dependencies

This composable depends on:

1. **`useI18n`**: Ensures localization support for error messages
2. **`createError`**: Nuxt's built-in error handling function for fatal errors
3. **`useToast`**: For displaying non-fatal error notifications
