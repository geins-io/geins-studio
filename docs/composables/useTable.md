# `useTable`

The `useTable` composable provides utilities for table state management and configuration.

## Features

- **Column visibility management** with type-safe column references

## Usage

### Basic Usage

```ts
const { getVisibilityState } = useTable<Product>();
const hiddenColumns: StringKeyOf<Product>[] = ['_id'];
const visibilityState = getVisibilityState(hiddenColumns);
```

```vue
<template>
  <TableView ... :init-visibility-state="visibilityState" ... />
</template>
```

## Type Definitions

```ts
function useTable<T>(): UseTableReturnType<T>;

interface UseTableReturnType<T> {
  getVisibilityState: (hiddenColumns: StringKeyOf<T>[]) => VisibilityState;
}
```

## Dependencies

This composable depends on:

1. **TanStack Vue Table** for VisibilityState type definition
