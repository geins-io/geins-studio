# Data Table Composables

To easily integrate the data tables in your list pages, Geins Studio provides composables for handling the data tables.

## `useColumns`

The `useColumns` composable is used to define the columns of the data table based on the data of the table. It has functions to create or extend the columns of the table.

```ts
const useColumns: <T extends object>() => {
  getColumns: (data: T[], options?: Partial<ColumnOptions>) => ColumnDef<T>[];
  extendColumns: (
    columns: ColumnDef<T>[],
    column: ColumnDef<T>,
  ) => ColumnDef<T>[];
};
```

### `getColumns`

Without options this is used to get a standard setup of columns where the keys will be the column headers and the values will be the data of the column, rendered as strings. By default all columns are sortable.

```vue
<script setup>
const { data } = await useFetch<Category[]>('/api/categories');

const { getColumns } = useColumns<Category>();
const columns = getColumns(data.value);
</script>
```

#### Column options

The `getColumns` function can take an optional `options` object with the following properties:

```ts
interface ColumnOptions {
  selectable?: boolean;
  sortable?: boolean;
  columnTypes?: ColumnTypes;
}

interface ColumnTypes {
  [key: string]: 'string' | 'currency' | 'date' | 'number';
}
```

##### Example

With these settings below, the columns will be selectable (adding a checkbox to the first column) and the column with the key `price` will be rendered as a currency.

```vue
<script setup>
const { data } = await useFetch<Product[]>('/api/products');

const { getColumns } = useColumns<Product>();
const columns = getColumns(products.value, {
  selectable: true,
  columnTypes: { price: 'currency' },
});
</script>
```

### `extendColumns`

The `extendColumns` function is used to add a new column to the existing columns. It takes the existing columns and the new column as arguments.

### `addExpandingColumn`

The `addExpandingColumn` function adds an expander column for hierarchical data display. This allows rows to be expanded to show child rows (e.g., products with SKUs).

```vue
<script setup>
const { data: products } = await useFetch<Product[]>('/api/products');

const { getColumns, addExpandingColumn } = useColumns<Product>();

let columns = getColumns(products.value);
columns = addExpandingColumn(columns);
</script>

<template>
  <TableView
    :columns="columns"
    :data="products"
    :enable-expanding="true"
    :get-sub-rows="(row) => row.skus"
  />
</template>
```

:::info
For more detailed documentation on `useColumns`, see the [full composable reference](/composables/useColumns).
:::
