# `useGeinsLog`

The `useGeinsLog` composable provides utility functions for logging messages with a Geins tag. It integrates with the `log` utility to offer scoped logging capabilities.

## Features

- Log general messages with a Geins tag (only when debug is true)
- Log error messages with a Geins tag.
- Log info messages with a Geins tag.
- Log warning messages with a Geins tag.

## Usage

```vue
<script setup lang="ts">
import { useGeinsLog } from '@/composables/useGeinsLog';

const { geinsLog, geinsLogError, geinsLogInfo, geinsLogWarn } =
  useGeinsLog('pages/index.vue');

const someVariable = ['some value'];

geinsLog('My value', someVariable); // Will not log anything if env GEINS_DEBUG is false
geinsLogError('This is an error message'); // Will always log
geinsLogInfo('This is an info message'); // Will always log
geinsLogWarn('This is a warning message'); // Will always log
</script>
```

The `geinsLog` from the example above will log the following message:

```
[geins] pages/index.vue ::: My value ['some value']
```

## Parameters

### `scope`

- **Type:** `string`
- **Description:** A string representing the scope or context of the log messages (e.g., component or file name).
- **Example:** `'components/ProductCard.vue'`

## Properties and Methods

### `geinsLog`

```ts
geinsLog(...args: any[]): void
```

Logs a general message with a Geins tag (only when debug is enabled).

- **Parameters:**
  - `...args`: Messages and additional arguments to log

### `geinsLogError`

```ts
geinsLogError(...args: any[]): void
```

Logs an error message with a Geins tag.

- **Parameters:**
  - `...args`: Error messages and additional arguments to log

### `geinsLogInfo`

```ts
geinsLogInfo(...args: any[]): void
```

Logs an info message with a Geins tag.

- **Parameters:**
  - `...args`: Info messages and additional arguments to log

### `geinsLogWarn`

```ts
geinsLogWarn(...args: any[]): void
```

Logs a warning message with a Geins tag.

- **Parameters:**
  - `...args`: Warning messages and additional arguments to log

## Example

Here's a comprehensive example showing how to use the `useGeinsLog` composable:

```vue
<script setup lang="ts">
const { geinsLog, geinsLogError, geinsLogInfo, geinsLogWarn } = useGeinsLog(
  'components/ProductCard.vue',
);

// Debug logging (only shows when debug is enabled)
const productData = { id: 1, name: 'Test Product' };
geinsLog('Loading product data:', productData);

// Error logging (always shows)
const handleError = (error: Error) => {
  geinsLogError('Failed to load product:', error.message);
};

// Info logging (always shows)
const handleSuccess = () => {
  geinsLogInfo('Product loaded successfully');
};

// Warning logging (always shows)
const handleWarning = () => {
  geinsLogWarn('Product price not available, using default');
};
</script>
```

## Dependencies

This composable depends on:

1. **`log` utility**: Core logging functionality with scoped logging
2. **`useRuntimeConfig`**: Runtime configuration for debug settings

## Type Definitions

```ts
function useGeinsLog(scope: string): GeinsLogger;

interface GeinsLogger {
  geinsLog: (...args: any[]) => void;
  geinsLogError: (...args: any[]) => void;
  geinsLogInfo: (...args: any[]) => void;
  geinsLogWarn: (...args: any[]) => void;
}
```
