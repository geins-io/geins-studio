# `TablePagination`

`TablePagination` is the footer bar rendered inside [`TableView`](/components/table/TableView) — page navigation, page-size selector, and a localized row counter. Generic over the row type and bound to a [TanStack Table](https://tanstack.com/table/latest/docs/introduction) instance.

## Features

- Localized row counter ("X of Y rows selected" / "X rows total")
- Page-size dropdown (`pageSizes`, default 30 / 60 / 120 / 240) — only in advanced mode
- Server-mode aware: the total comes from the table's `rowCount` option when set
- First / Prev / Next / Last navigation with disabled states tied to TanStack Table
- Responsive: collapses on small viewports

## Usage

`TableView` mounts this internally. Use it directly only when building a custom table on top of TanStack:

```vue
<script setup lang="ts" generic="T">
import {
  useVueTable,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/vue-table';

const table = useVueTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
</script>

<template>
  <TablePagination
    :table="table"
    :rows-selectable="true"
    entity-key="quotation"
    :advanced="true"
  />
</template>
```

## Props

### `table`

```ts
table: Table<TData>;
```

[TanStack Table](https://tanstack.com/table/latest/docs/introduction) instance.

### `rowsSelectable`

```ts
rowsSelectable: boolean;
```

When `true`, the row counter renders "X of Y selected" instead of "Y total".

### `entityKey`

```ts
entityKey: string;
```

i18n key for the entity used in the counter and "rows per page" labels.

### `advanced`

```ts
advanced: boolean;
```

Shows the page-size selector. Hidden in simple/minimal modes.

### `pageSizes`

```ts
pageSizes?: number[]
```

Options in the page-size selector.

- **Default:** `[30, 60, 120, 240]`

## Row total

The total is `table.options.rowCount` when set (server mode), otherwise the number of filtered rows. It deliberately isn't `table.getRowCount()`: without `rowCount` that counts the expanded row model, so an expanding table's total would grow as rows are expanded.

## Dependencies

- shadcn-vue [`Button`](/components/button/ButtonIcon), [`Select`](/components/shadcn-vue)
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) for the underlying pagination state
