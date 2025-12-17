# `useColumns`

The `useColumns` composable provides comprehensive utilities for generating and managing data table columns with automatic type inference, styling, and advanced features. It supports multiple column types, editable cells, actions, and responsive design patterns.

::: tip
This composable is designed to work seamlessly with `@tanstack/vue-table` and the application's design system components.
:::

## Features

- **Automatic column generation** from data with intelligent type inference
- **Multiple column types** (text, currency, date, image, status, editable, etc.)
- **Responsive design** with adaptive styling for different screen sizes
- **Selectable rows** with checkbox column support
- **Sortable columns** with custom header components
- **Action columns** for row-specific operations (edit, delete, custom actions)
- **Editable cells** with inline editing capabilities
- **Link columns** for both internal entity navigation and external URLs
- **Localization support** for column titles and formatting
- **Customizable styling** and cell renderers

## Usage

### Basic Usage Example

```ts
// Simple column generation from data
const { getColumns } = useColumns<Product>();
const columns = getColumns(products.value);
```

### Advanced Usage Example

```vue
<script setup lang="ts">
import type { Product } from '#shared/types';

// Fetch data mock example
const { data: products } = await useFetch<Product[]>('/api/products');

// Configure columns
const { getColumns, addActionsColumn } = useColumns<Product>();
const { getEntityUrl } = useEntityUrl();

const columnOptions = {
  selectable: true,
  linkColumns: {
    name: {
      url: getEntityUrl('{id}'), // -> /pim/product/{id}
      idField: '_id', // Will replace {id} with product._id
    },
  },
  columnTypes: {
    name: 'link',
    price: 'currency',
    active: 'status',
    thumbnail: 'image',
  },
  columnTitles: {
    name: 'Product Name',
    thumbnail: '',
  },
};

let columns = getColumns(products.value, columnOptions);
columns = addActionsColumn(columns, {
  onEdit: (product) => navigateTo(getEntityUrl(`${product._id}`)),
  onDelete: (product) => handleDelete(product._id),
});
</script>

<template>
  <TableView :columns="columns" :data="products" />
</template>
```

## Column Options

### `selectable`

Enable a checkbox column for row selection. Default is `false`.

### `sortable`

Enable sorting for all columns. Default is `true`.

### `maxTextLength`

Maximum character length for text display before truncation. Default is `60`.

### `columnTitles`

Custom titles for columns. By default titles are generated from the key names. Use this option to override specific titles.

**Example**

```ts
columnTitles: {
  name: 'Product Name',
  price: 'Price (USD)',
}
```

### `columnTypes`

Define specific types for columns to control rendering and behavior. See [Column Types](#column-types) for for information.

**Example**

```ts
columnTypes: {
  name: 'link',
  price: 'currency',
}
```

### `sortableColumns`

Define sortable behavior for individual columns. Overrides the global `sortable` option.

**Example**

```ts
sortableColumns: {
  name: true,
  price: false,
}
```

### `excludeColumns`

Exclude specific columns from being displayed. These columns will be completely hidden from the table.

**Example**

```ts
excludeColumns: ['internalName', 'internalId'];
```

### `includeColumns`

Include only specific columns. When provided, only these columns will be displayed (acts as a whitelist).

**Example**

```ts
includeColumns: ['name', 'price', 'status'];
```

### `columnCellProps`

Pass additional props to specific column cell components. Useful for configuring editable columns, tooltips, and other interactive elements.

**Example**

```ts
columnCellProps: {
  price: {
    onBlur: (value: string | number, row: Row<Product>) => {
      // Handle new price value on blur
    },
  },
}
```

### `linkColumns`

Configure clickable links for specific columns. See [Link Columns](#link-columns) section for detailed examples.

**Example**

```ts
linkColumns: {
  name: {
    url: '/parent/entity/{id}',
    idField: '_id',
  },
  website: {
    url: 'https://example.com',
  },
}
```

## Properties and Methods

### `getBasicHeaderStyle`

```ts
getBasicHeaderStyle(
  table: Table<T>
): string
```

Returns the Tailwind CSS classes for basic header styling with responsive design support.

- **Parameters**:
  - `table`: The TanStack table instance
- **Returns**: CSS class string for header styling
- **Usage**: Mainly used internally, but available for custom header renderers

### `getBasicCellStyle`

```ts
getBasicCellStyle(
  table: Table<T>
): string
```

Returns the Tailwind CSS classes for basic cell styling with responsive design support.

- **Parameters**:
  - `table`: The TanStack table instance
- **Returns**: CSS class string for cell styling
- **Usage**: Mainly used internally, but available for custom cell renderers

### `getColumns`

```ts
getColumns(
  data: T[],
  options?: Partial<ColumnOptions<T>>
): ColumnDef<T>[]
```

Generates column definitions from data with intelligent type inference and customization options.

- **Parameters**:
  - `data`: Array of data objects to generate columns from
  - `options`: Optional configuration object. See [`Column Options`](#column-options) for full details.

- **Returns**: Array of TanStack table column definitions

:::warning NOTE
The `_type` field is most commonly not meant for display. Therefore, it is automatically excluded from column generation.
:::

### `extendColumns`

```ts
extendColumns(
  columns: ColumnDef<T>[],
  column: ColumnDef<T>
): ColumnDef<T>[]
```

Adds a new column to existing column definitions.

- **Parameters**:
  - `columns`: Existing column definitions array
  - `column`: New column definition to add
- **Returns**: Updated columns array with the new column

### `addActionsColumn`

```ts
addActionsColumn(
  columns: ColumnDef<T>[],
  props: Record<string, Function>,
  type: 'actions' | 'delete' | 'edit' = 'actions',
  availableActions?: TableRowActions[]
): ColumnDef<T>[]

type TableRowActions = 'edit' | 'copy' | 'delete';
```

Adds an actions column for row-specific operations.

- **Parameters**:
  - `columns`: Existing column definitions
  - `props`: Props to pass to action components
  - `type`: Type of actions column (default: 'actions')
  - `availableActions`: Available actions for the row
- **Returns**: Updated columns with actions column added to the end

### `orderAndFilterColumns`

```ts
orderAndFilterColumns(
  columns: ColumnDef<T>[],
  keys: (keyof T)[]
): ColumnDef<T>[]
```

Reorders and filters columns based on provided keys. Only provided keys will be included in the result, in the specified order.

- **Parameters**:
  - `columns`: Column definitions to reorder
  - `keys`: Array of column keys in desired order
- **Returns**: Reordered and filtered columns

### `orderColumnLast`

```ts
orderColumnLast(
  columns: ColumnDef<T>[],
  key: keyof T
): ColumnDef<T>[]
```

Moves a specific column to the end of the columns array.

- **Parameters**:
  - `columns`: Column definitions array
  - `key`: Key of column to move to last position
- **Returns**: Reordered columns array

## Column Types

### Inferred Types

When no specific `columnTypes` are provided, the system automatically infers types based on key names:

- Keys containing **date** are inferred as `date`
- Keys containing **price** or **amount** are inferred as `currency`
- Keys containing **image**, **img**, or **thumbnail** are inferred as `image`
- Keys exactly named **channels** are inferred as `channels`
- Keys exactly named **tags** are inferred as `tags`
- Keys exactly named **active** or **status** are inferred as `status`
- All other keys default to `default` type (which handles strings, booleans, and arrays in a graceful manner)

### Column Types Overview

| Type                  | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `default`             | Basic text display with truncation, boolean indicators, and array formatting          |
| `currency`            | Expects object with `price` and `currency` properties, displays formatted currency    |
| `price`               | Simple number formatting as currency with current locale and current currency         |
| `date`                | Formats to date using current locale                                                  |
| `image`               | Displays images as small thumbnails with alt text                                     |
| `link`                | Creates clickable links using NuxtLink with internal/external URL support             |
| `channels`            | Displays channel IDs as badge components with channel names using `TableCellChannels` |
| `tags`                | Displays string arrays as tag badge components using `TableCellTags`                  |
| `status`              | Shows status indicators for string or boolean values using `TableCellStatus`          |
| `tooltip`             | Text with hover tooltip functionality using `TableCellTooltip`                        |
| `editable-string`     | Inline editable text field using `TableCellEditable`                                  |
| `editable-number`     | Inline editable number input using `TableCellEditable`                                |
| `editable-currency`   | Inline editable currency input with formatting using `TableCellEditable`              |
| `editable-percentage` | Inline editable percentage input using `TableCellEditable`                            |

### Editable Columns

```ts
// Configure editable columns with handlers
const editableOptions: ColumnOptions<Product> = {
  columnTypes: {
    price: 'editable-currency',
    discount: 'editable-percentage',
  },
  columnCellProps: {
    price: {
      onBlur: (value: string | number, row: Row<Product>) => {
        // Handle new price value on blur
      },
    },
    discount: {
      onChange: (value: string | number, row: Row<Product>) => {
        // Handle new discount value on change
      },
    },
  },
};
```

## Dependencies

This composable depends on:

1. **`@tanstack/vue-table`**: Core table functionality and type definitions
2. **`useViewport`**: Responsive design support
3. **`useAccountStore`**: Currency and localization settings

## Integration with Entity System

The `useColumns` composable integrates seamlessly with the entity system:

```ts
// Combine with useEntityUrl for entity linking
const { getEntityUrl } = useEntityUrl();
const { getColumns } = useColumns<Product>();

const columns = getColumns(products.value, {
  columnTypes: { name: 'link' },
  linkColumns: {
    name: {
      url: getEntityUrl('{id}'), // Uses current entity context
      idField: '_id',
    },
  },
});
```

## Type Definitions

### Column Options

```ts
function useColumns<T>(): UseColumnsReturnType<T>;

interface ColumnOptions<T> {
  selectable?: boolean;
  sortable?: boolean;
  maxTextLength?: number;
  columnTitles?: Partial<Record<StringKeyOf<T>, string>>;
  columnTypes?: ColumnTypes<T>;
  sortableColumns?: Partial<Record<StringKeyOf<T>, boolean>>;
  excludeColumns?: StringKeyOf<T>[];
  includeColumns?: StringKeyOf<T>[];
  columnCellProps?: Partial<Record<StringKeyOf<T>, Record<string, unknown>>>;
  linkColumns?: Partial<Record<StringKeyOf<T>, LinkColumnConfig<T>>>;
}

type ColumnTypes<T> = Partial<Record<StringKeyOf<T>, ColumnType>>;

interface LinkColumnConfig<T> {
  url: string;
  idField?: StringKeyOf<T>;
}

type StringKeyOf<T> = Extract<keyof T, string>;

type EditableColumnType = 'string' | 'number' | 'currency' | 'percentage';

export type ColumnType =
  | 'default'
  | 'currency'
  | 'price'
  | 'date'
  | 'number'
  | 'image'
  | 'link'
  | 'select'
  | 'actions'
  | 'channels'
  | 'tags'
  | 'status'
  | 'tooltip'
  | 'boolean'
  | `editable-${EditableColumnType}`;
```

### Return Type

```ts
interface UseColumnsReturnType<T> {
  getBasicHeaderStyle: (table: Table<T>) => string;
  getBasicCellStyle: (table: Table<T>) => string;
  getColumns: (
    data: T[],
    options?: Partial<ColumnOptions<T>>,
  ) => ColumnDef<T>[];
  extendColumns: (
    columns: ColumnDef<T>[],
    column: ColumnDef<T>,
  ) => ColumnDef<T>[];
  addActionsColumn: (
    columns: ColumnDef<T>[],
    props: object,
    type?: 'actions' | 'delete' | 'edit',
    availableActions?: TableRowAction[],
  ) => ColumnDef<T>[];
  orderAndFilterColumns: (
    columns: ColumnDef<T>[],
    keys: (keyof T)[],
  ) => ColumnDef<T>[];
  orderColumnLast: (columns: ColumnDef<T>[], key: keyof T) => ColumnDef<T>[];
}

type TableRowAction = 'edit' | 'copy' | 'delete';
```
