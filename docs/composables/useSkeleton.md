# `useSkeleton`

The `useSkeleton` composable provides utility functions to generate skeleton loaders for table data and columns. It integrates with the `@tanstack/vue-table` library and is used internally by our TableView component to display placeholder content while data is loading.

## Features

- Generate mock data for skeleton loading.
- Create skeleton column definitions compatible with `@tanstack/vue-table`.
- Use a custom `Skeleton` component for rendering placeholder content.

## Usage

Here is how you can use the `useSkeleton` composable in your project:

```ts
import { useSkeleton } from '@/composables/skeleton';

const { getSkeletonData, getSkeletonColumns } = useSkeleton();

const data = getSkeletonData();
const columns = getSkeletonColumns(data);
```

## Returned Methods

### `getSkeletonData<T>(pageSize: number = 30): T[]`

Generates an array of mock skeleton data.

- **Parameters:**
  - `pageSize` (optional): The number of rows to generate. Default is `30`.
- **Returns:** An array of mock data with placeholder values.

- **Example:**
  ```ts
  const data = getSkeletonData(10);
  console.log(data);
  // Output: [{ index: 0, id: 'id', name: 'name', data: 'data', data1: 'data1' }, ...]
  ```

### `getSkeletonColumns<T>(data: T[]): ColumnDef<T>[]`

Generates an array of skeleton column definitions.

- **Parameters:**
  - `data`: The mock data to generate columns for.
- **Returns:** An array of column definitions compatible with `@tanstack/vue-table`.

- **Example:**
  ```ts
  const columns = getSkeletonColumns(data);
  console.log(columns);
  // Output: [{ key: 'index', label: 'Index', sortable: true }, ...]
  ```
