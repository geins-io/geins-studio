# useEntityError

A specialized composable for handling entity-related errors in edit, view, and list pages. Provides consistent error handling with proper status codes, user feedback, and i18n support.

## Import

```typescript
import { useEntityError } from '#app/composables/useEntityError';
```

## Basic Usage

```typescript
const { handleFetchError, validateEntityData, throwEntityError } =
  useEntityError('price_list');
```

## API Reference

### Parameters

```typescript
function useEntityError(entityName?: string): {
  throwEntityError: (statusCode: number, customMessage?: string) => never;
  handleFetchError: (error: any, entityId?: string) => void;
  showEntityErrorToast: (error: any, customMessage?: string) => Promise<void>;
  validateEntityData: <T>(
    data: T | null | undefined,
    entityId?: string,
  ) => NonNullable<T>;
};
```

#### `entityName` (optional)

- **Type:** `string`
- **Description:** The name of the entity being handled. Used for i18n error messages.
- **Example:** `'price_list'`, `'wholesale_account'`, `'product'`

## Methods

### throwEntityError()

Throws a fatal error that navigates the user to the appropriate error page.

```typescript
throwEntityError(statusCode: number, customMessage?: string): never
```

#### Parameters

- `statusCode` - HTTP status code (404, 500, etc.)
- `customMessage` - Optional custom error message (overrides i18n)

#### Usage

```typescript
const { throwEntityError } = useEntityError('price_list');

// Throw 404 error with default message
throwEntityError(404);

// Throw 500 error with custom message
throwEntityError(500, 'Database connection failed');

// Throw 403 forbidden error
throwEntityError(403, 'You do not have permission to access this price list');
```

#### Behavior

- Creates a fatal Nuxt error using `createError()`
- Automatically uses i18n messages based on entity name and status code
- Navigates user to the root error page (`/error.vue`)
- Error page displays appropriate UI based on status code

---

### handleFetchError()

Handles errors from `useAsyncData` or API calls, automatically determining the appropriate response.

```typescript
handleFetchError(error: any, entityId?: string): void
```

#### Parameters

- `error` - Error object from `useAsyncData` or API call
- `entityId` - Optional entity ID for more specific error messages

#### Usage

```typescript
const { handleFetchError } = useEntityError('price_list');

// Basic usage
const { data, error } = await useAsyncData(() => productApi.priceList.get(id));

if (error.value) {
  handleFetchError(error.value, id);
}

// With custom fetch
try {
  const result = await productApi.priceList.get(id);
} catch (error) {
  handleFetchError(error, id);
}
```

#### Behavior

- Detects 404 errors → throws 404 fatal error
- Detects 5xx errors → throws 500 fatal error
- Unknown errors → throws 500 fatal error with error message
- Includes entity ID in error message when provided

---

### validateEntityData()

Validates that fetched data exists (not null/undefined), throwing a 404 error if validation fails.

```typescript
validateEntityData<T>(data: T | null | undefined, entityId?: string): NonNullable<T>
```

#### Parameters

- `data` - Data to validate (can be null or undefined)
- `entityId` - Optional entity ID for error message

#### Returns

- The validated data with TypeScript null/undefined removed from type

#### Usage

```typescript
const { validateEntityData } = useEntityError('price_list');

// Basic validation
const { data, error } = await useAsyncData(() => productApi.priceList.get(id));

// Throws 404 if data.value is null/undefined
const priceList = validateEntityData(data.value, id);

// TypeScript now knows priceList is not null/undefined
console.log(priceList.name); // No TypeScript error

// Chain with error handling
if (error.value) {
  handleFetchError(error.value, id);
}
const entity = validateEntityData(data.value, id);
```

#### Behavior

- Returns data if it exists
- Throws 404 fatal error if data is null or undefined
- Removes null/undefined from TypeScript type
- Includes entity ID in error message when provided

---

### showEntityErrorToast()

Shows a non-fatal error toast notification instead of navigating to an error page.

```typescript
showEntityErrorToast(error: any, customMessage?: string): Promise<void>
```

#### Parameters

- `error` - Error object
- `customMessage` - Optional custom error message (overrides default)

#### Usage

```typescript
const { showEntityErrorToast } = useEntityError('price_list');

// Show default error message
try {
  await productApi.priceList.update(id, data);
} catch (error) {
  await showEntityErrorToast(error);
}

// Show custom error message
try {
  await productApi.priceList.delete(id);
} catch (error) {
  await showEntityErrorToast(
    error,
    'Cannot delete price list with active orders',
  );
}
```

#### Behavior

- Shows toast notification (negative variant)
- Uses i18n messages based on entity name
- Does not navigate away from current page
- Suitable for recoverable errors

## Complete Examples

### Example 1: Entity Edit Page

Full implementation in a price list edit page:

```vue
<script setup lang="ts">
import type { ProductPriceList } from '#shared/types';

const route = useRoute();
const { productApi } = useGeinsRepository();
const { t } = useI18n();

// Initialize error handler
const { handleFetchError, validateEntityData, showEntityErrorToast } =
  useEntityError('price_list');

// Setup entity edit
const entityId = computed(() => String(route.params.id));
const createMode = ref(route.params.id === 'new');
const entityData = ref<ProductPriceList | null>(null);

// Fetch data in edit mode
if (!createMode.value) {
  const { data, error } = await useAsyncData<ProductPriceList>(() =>
    productApi.priceList.get(entityId.value, {
      fields: ['rules', 'selectionquery'],
    }),
  );

  // Handle errors (404, 500, etc.)
  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  // Validate and assign data
  entityData.value = validateEntityData(data.value, entityId.value);
}

// Save handler with non-fatal error handling
const handleSave = async () => {
  try {
    await productApi.priceList.update(entityId.value, entityData.value);
    toast({
      title: t('entity_updated', { entityName: 'price_list' }),
      variant: 'positive',
    });
  } catch (error) {
    // Show toast instead of navigating away
    await showEntityErrorToast(error, 'Failed to save changes');
  }
};

// Delete handler with fatal error handling
const handleDelete = async () => {
  try {
    await productApi.priceList.delete(entityId.value);
    navigateTo('/wholesale/price-list/list');
  } catch (error) {
    // Show toast for delete failures
    await showEntityErrorToast(error, 'Failed to delete price list');
  }
};
</script>

<template>
  <div>
    <!-- Your edit form -->
  </div>
</template>
```

### Example 2: Entity List Page

Error handling in a list view:

```vue
<script setup lang="ts">
import type { ProductPriceList } from '#shared/types';

const { productApi } = useGeinsRepository();
const { showEntityErrorToast } = useEntityError('price_list');

const dataList = ref<ProductPriceList[]>([]);

// Fetch list data
const { data, error } = await useAsyncData<ProductPriceList[]>(() =>
  productApi.priceList.list(),
);

// For list pages, show toast instead of error page
if (error.value) {
  await showEntityErrorToast(error.value, 'Failed to load price lists');
  dataList.value = []; // Set empty array as fallback
} else {
  dataList.value = data.value || [];
}

// Delete handler
const handleDelete = async (id: string) => {
  try {
    await productApi.priceList.delete(id);
    // Refresh list
    dataList.value = dataList.value.filter((item) => item._id !== id);
  } catch (error) {
    await showEntityErrorToast(error, 'Failed to delete price list');
  }
};
</script>
```

### Example 3: Nested Entity Loading

Handling multiple entity loads with proper error handling:

```vue
<script setup lang="ts">
import type { WholesaleAccount, ProductPriceList } from '#shared/types';

const { wholesaleApi, productApi } = useGeinsRepository();
const { handleFetchError, validateEntityData } =
  useEntityError('wholesale_account');

const entityId = computed(() => String(route.params.id));
const createMode = ref(route.params.id === 'new');

if (!createMode.value) {
  // Load main entity
  const { data: accountData, error: accountError } = await useAsyncData(() =>
    wholesaleApi.account.get(entityId.value, { fields: ['all'] }),
  );

  if (accountError.value) {
    handleFetchError(accountError.value, entityId.value);
  }

  const account = validateEntityData(accountData.value, entityId.value);

  // Load related entities (non-fatal errors)
  const { data: priceListsData, error: priceListsError } = await useAsyncData(
    () => productApi.priceList.list({ fields: ['products'] }),
  );

  if (priceListsError.value) {
    // Show toast for related entity errors
    const { showEntityErrorToast } = useEntityError('price_list');
    await showEntityErrorToast(
      priceListsError.value,
      'Failed to load price lists',
    );
  }

  // Continue with available data
  const priceLists = priceListsData.value || [];
}
</script>
```

### Example 4: Custom Error Messages with Context

Providing context-specific error handling:

```vue
<script setup lang="ts">
const { throwEntityError, handleFetchError } = useEntityError('price_list');

// Check permissions before loading
const userStore = useUserStore();
if (!userStore.hasPermission('price_list.read')) {
  throwEntityError(403, 'You do not have permission to view price lists');
}

// Load with ID validation
const entityId = computed(() => String(route.params.id));

if (!entityId.value || entityId.value === 'undefined') {
  throwEntityError(400, 'Invalid price list ID');
}

// Fetch with detailed error handling
const { data, error } = await useAsyncData(() =>
  productApi.priceList.get(entityId.value),
);

if (error.value) {
  if (error.value.statusCode === 404) {
    handleFetchError(error.value, entityId.value);
  } else if (error.value.statusCode === 403) {
    throwEntityError(
      403,
      `You do not have access to price list ${entityId.value}`,
    );
  } else {
    handleFetchError(error.value, entityId.value);
  }
}
</script>
```

## When to Use Each Method

### Use `throwEntityError()` when:

- Need to throw a custom error with specific status code
- Have explicit error conditions (permissions, validation)
- Want to immediately navigate to error page

### Use `handleFetchError()` when:

- Wrapping `useAsyncData` or API calls
- Don't know the specific error type
- Want automatic error type detection

### Use `validateEntityData()` when:

- Need to ensure data exists after fetch
- Want TypeScript null safety
- Data being null/undefined should be treated as 404

### Use `showEntityErrorToast()` when:

- Error is recoverable (user can retry)
- Operation is not critical to page function
- Want to keep user on current page

## Type Safety

The composable is fully type-safe:

```typescript
const { validateEntityData } = useEntityError('price_list');

// data type is ProductPriceList | null | undefined
const { data } = await useAsyncData<ProductPriceList>(() => api.get(id));

// priceList type is ProductPriceList (null/undefined removed)
const priceList = validateEntityData(data.value);

// TypeScript knows this is safe
console.log(priceList.name); // No error
console.log(priceList.currency); // No error
```

## Internationalization

The composable uses i18n keys for error messages. Add these to your locale files:

```json
{
  "entity_not_found": "{entityName} not found",
  "entity_with_id_not_found": "{entityName} with ID {id} not found",
  "server_error_loading_entity": "Server error loading {entityName}",
  "error_loading_entity": "Error loading {entityName}",
  "feedback_error_description": "Please try again or contact support"
}
```

## Related

- [Error Handling Guide](/docs/guides/error-handling.md)
- [Error404 Component](/docs/components/Error404.md)
- [Error500 Component](/docs/components/Error500.md)
- [useEntityEdit Composable](/docs/composables/useEntityEdit.md)
