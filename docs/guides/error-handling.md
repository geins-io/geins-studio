# Error Handling Implementation Guide

This guide explains the comprehensive error handling system implemented for the Geins Studio application, with a focus on entity edit pages and 404/500 error scenarios.

## Overview

The error handling system consists of:

1. **Error Components**: Reusable UI components for different error states
2. **Root Error Handler**: Global error page that routes to appropriate error components
3. **Entity Error Composable**: Utility for handling entity-specific errors
4. **Integration with Entity Edit Pages**: Seamless error handling in CRUD operations

## Components

### Error404.vue

A user-friendly 404 error page built with the shadcn/vue Empty component.

**Features:**

- Clean, centered layout using the Empty component
- Customizable error message
- Optional "Go Back" button (respects browser history)
- Optional "Go Home" button
- Icon-based visual feedback (FileQuestion icon)

**Props:**

```typescript
{
  message?: string;           // Custom error message
  showBackButton?: boolean;   // Show/hide back button (default: true)
  showHomeButton?: boolean;   // Show/hide home button (default: true)
}
```

**Usage:**

```vue
<Error404
  message="This price list does not exist"
  :show-back-button="true"
  :show-home-button="true"
/>
```

### Error500.vue

A comprehensive 500 error page for server and application errors.

**Features:**

- Clean, centered layout using the Empty component
- Customizable error message
- Optional error details display (for development mode)
- Optional "Refresh Page" button
- Optional "Go Home" button
- Icon-based visual feedback (ServerCrash icon)

**Props:**

```typescript
{
  message?: string;           // Custom error message
  errorDetails?: string;      // Stack trace or error details
  showRefreshButton?: boolean;// Show/hide refresh button (default: true)
  showHomeButton?: boolean;   // Show/hide home button (default: true)
  showErrorDetails?: boolean; // Show/hide error details (default: false)
}
```

**Usage:**

```vue
<Error500
  message="Failed to load price list data"
  :error-details="error?.stack"
  :show-error-details="isDevelopment"
/>
```

## Root Error Handler (error.vue)

The root error handler automatically routes to the appropriate error component based on the HTTP status code.

**Features:**

- Automatic 404 detection and routing
- Automatic 500+ server error detection
- Development mode support (shows stack traces)
- Wrapped in default layout for consistency
- Production-safe (hides sensitive error details)

**Status Code Routing:**

- `404` → Error404 component
- `500+` → Error500 component
- Other → Error500 component (fallback)

## Entity Error Composable (useEntityError)

A specialized composable for handling entity-related errors in edit/view pages.

### Methods

#### `throwEntityError(statusCode, customMessage?)`

Throws a fatal error that triggers the root error handler.

```typescript
const { throwEntityError } = useEntityError('price_list');

// Throw 404 error
throwEntityError(404);

// Throw 500 error with custom message
throwEntityError(500, 'Database connection failed');
```

#### `handleFetchError(error, entityId?)`

Handles errors from `useAsyncData` calls, automatically determining the appropriate status code.

```typescript
const { data, error } = await useAsyncData(() => api.priceList.get(id));

if (error.value) {
  handleFetchError(error.value, id);
}
```

#### `validateEntityData(data, entityId?)`

Validates that fetched data exists, throwing a 404 error if null/undefined.

```typescript
const { data, error } = await useAsyncData(() => api.priceList.get(id));

// Throws 404 if data is null/undefined
const priceList = validateEntityData(data.value, id);
```

#### `showEntityErrorToast(error, customMessage?)`

Shows a non-fatal error toast notification instead of navigating to error page.

```typescript
try {
  await api.priceList.update(id, data);
} catch (error) {
  showEntityErrorToast(error, 'Failed to save changes');
}
```

## Integration with Entity Edit Pages

### Example: Price List Edit Page

Here's how to integrate error handling into an entity edit page:

```vue
<script setup lang="ts">
import type { ProductPriceList } from '#shared/types';

const route = useRoute();
const entityId = computed(() => String(route.params.id));
const { productApi } = useGeinsRepository();

// Initialize entity error handler
const { handleFetchError, validateEntityData } = useEntityError('price_list');

// Create mode doesn't need error handling
const createMode = ref(route.params.id === 'new');

if (!createMode.value) {
  // Fetch entity data with error handling
  const { data, error } = await useAsyncData<ProductPriceList>(() =>
    productApi.priceList.get(entityId.value, {
      fields: ['rules', 'selectionquery'],
    }),
  );

  // Handle fetch errors (404, 500, etc.)
  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  // Validate data exists (throws 404 if null)
  const priceList = validateEntityData(data.value, entityId.value);

  // Continue with normal flow
  await parseAndSaveData(priceList);
}
</script>
```

### Example: Account Edit Page

```vue
<script setup lang="ts">
import type { WholesaleAccount } from '#shared/types';

const route = useRoute();
const entityId = computed(() => String(route.params.id));
const { wholesaleApi } = useGeinsRepository();
const { handleFetchError, validateEntityData } =
  useEntityError('wholesale_account');

const createMode = ref(route.params.id === 'new');

if (!createMode.value) {
  const { data, error } = await useAsyncData<WholesaleAccount>(() =>
    wholesaleApi.account.get(entityId.value, { fields: ['all'] }),
  );

  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  const account = validateEntityData(data.value, entityId.value);

  // Parse account data
  await parseEntityData(account);
}
</script>
```

## Error Handling Best Practices

### 1. Use Fatal Errors for Critical Failures

Fatal errors should be used when the page cannot function:

- Entity not found (404)
- Permission denied
- Critical API failures

```typescript
// Fatal - navigates to error page
if (error.value) {
  handleFetchError(error.value, entityId.value);
}
```

### 2. Use Toast Notifications for Recoverable Errors

Toast notifications should be used for operations that don't prevent page usage:

- Save failures (user can retry)
- Validation errors
- Partial failures

```typescript
// Non-fatal - shows toast
try {
  await updateEntity();
} catch (error) {
  showEntityErrorToast(error, 'Failed to save changes');
}
```

### 3. Provide Context in Error Messages

Always include relevant context:

```typescript
// Good
throwEntityError(404, `Price list with ID ${id} not found`);

// Better
throwEntityError(404); // Uses i18n with entity name
```

### 4. Differentiate Between Create and Edit Mode

Only check for entity existence in edit mode:

```vue
<script setup lang="ts">
const createMode = ref(route.params.id === 'new');

// Only fetch and validate in edit mode
if (!createMode.value) {
  const { data, error } = await useAsyncData(/* ... */);

  if (error.value) {
    handleFetchError(error.value);
  }
}
</script>
```

### 5. Handle Development vs Production

Show detailed errors in development, hide in production:

```typescript
<Error500
  :error-details="isDevelopment ? error?.stack : undefined"
  :show-error-details="isDevelopment"
/>
```

## Internationalization

The error handling system supports i18n. Add these keys to your locale files:

```json
{
  "error_404_title": "Page Not Found",
  "error_500_title": "Something Went Wrong",
  "error_details": "Error Details",
  "go_back": "Go Back",
  "home": "Home",
  "refresh_page": "Refresh Page",
  "entity_not_found": "{entityName} not found",
  "entity_with_id_not_found": "{entityName} with ID {id} not found",
  "server_error_loading_entity": "Server error loading {entityName}",
  "error_loading_entity": "Error loading {entityName}"
}
```

## Testing Error Scenarios

### Test 404 Errors

```typescript
// Navigate to non-existent entity
navigateTo('/wholesale/price-list/invalid-id-123');
```

### Test 500 Errors

```typescript
// Simulate server error
throw createError({
  statusCode: 500,
  statusMessage: 'Database connection failed',
});
```

### Test Network Errors

```typescript
// Test with network disconnected
// Error component should show with appropriate message
```

## Migration Guide

To migrate existing entity edit pages to use this error handling system:

1. **Import the composable:**

   ```typescript
   const { handleFetchError, validateEntityData } =
     useEntityError('entity_name');
   ```

2. **Wrap useAsyncData calls:**

   ```typescript
   // Before
   const { data, error } = await useAsyncData(() => api.entity.get(id));

   // After
   const { data, error } = await useAsyncData(() => api.entity.get(id));
   if (error.value) {
     handleFetchError(error.value, id);
   }
   ```

3. **Validate data:**

   ```typescript
   // Before
   if (data.value) {
     await parseData(data.value);
   }

   // After
   const entity = validateEntityData(data.value, id);
   await parseData(entity);
   ```

4. **Update toast error handling:**
   ```typescript
   // Keep existing toast error handling for non-critical errors
   // Only use fatal errors for scenarios where page cannot function
   ```

## Architecture Decisions

### Why shadcn/vue Empty Component?

- **Consistency**: Matches existing design system
- **Flexibility**: Highly composable with multiple sub-components
- **Accessibility**: Built-in ARIA support
- **Customization**: Easy to style and extend

### Why Separate Error Components?

- **Reusability**: Can be used independently of root error handler
- **Testing**: Easier to test in isolation
- **Flexibility**: Can be embedded in specific page sections if needed

### Why useEntityError Composable?

- **DRY**: Avoids repeating error handling logic
- **Type Safety**: Provides type-safe error handling
- **Consistency**: Ensures uniform error handling across pages
- **Centralized**: Easy to update error handling behavior globally

## Future Enhancements

Potential improvements for future iterations:

1. **Error Tracking**: Integrate with error monitoring service (Sentry, etc.)
2. **Retry Logic**: Add automatic retry for transient errors
3. **Offline Support**: Handle offline scenarios gracefully
4. **Error Recovery**: Provide more recovery options based on error type
5. **Custom Error Pages**: Entity-specific error pages with contextual actions
6. **Error Analytics**: Track common error patterns for improvement

## Support

For questions or issues with the error handling system, please refer to:

- This documentation
- Component source code in `app/components/error/`
- Composable source code in `app/composables/useEntityError.ts`
- Root error handler in `app/error.vue`
