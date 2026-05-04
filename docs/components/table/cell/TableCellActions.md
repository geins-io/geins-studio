# `TableCellActions`

`TableCellActions` is the standard row-actions cell — a `MoreHorizontal` trigger that opens a dropdown with edit / copy / delete entries. Generic over the row type. Used in the `actions` column of [`TableView`](/components/table/TableView).

## Features

- Three built-in actions: `edit`, `copy`, `delete` — toggle which appear via `availableActions`
- Per-row disable via `disabledActions` (array or function of the row)
- Emits typed events (`edit`, `copy`, `delete`) carrying the row data
- Compact icon-only trigger that scales between mobile and desktop

## Usage

### Basic Usage

```ts
import { h } from 'vue';

const columns: ColumnDef<Quotation>[] = [
  // …other columns…
  {
    id: 'actions',
    cell: ({ row }) =>
      h(TableCellActions, {
        rowData: row.original,
        availableActions: ['edit', 'delete'],
        onEdit: (data) => goToEdit(data._id),
        onDelete: (data) => deleteQuotation(data._id),
      }),
  },
];
```

### Conditionally disable actions per row

```ts
h(TableCellActions, {
  rowData: row.original,
  disabledActions: (row) => (row.status === 'sent' ? ['delete'] : []),
});
```

## Props

### `rowData`

```ts
rowData: T
```

The full row passed back through events.

### `availableActions`

```ts
availableActions?: TableRowAction[]
```

Which actions render in the dropdown.

- **Default:** `['edit', 'copy', 'delete']`

### `disabledActions`

```ts
disabledActions?: TableRowAction[] | ((rowData: T) => TableRowAction[])
```

Which actions are disabled. Pass an array for static rules or a function for per-row decisions.

## Events

### `edit`

```ts
(rowData: T): T
```

Emitted when the user clicks Edit.

### `copy`

```ts
(rowData: T): T
```

Emitted when the user clicks Copy.

### `delete`

```ts
(rowData: T): T
```

Emitted when the user clicks Delete.

## Type Definitions

```ts
type TableRowAction = 'edit' | 'copy' | 'delete';
```

## Dependencies

- shadcn-vue [`DropdownMenu`](/components/shadcn-vue), `Button`
