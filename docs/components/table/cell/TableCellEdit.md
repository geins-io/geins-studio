# `TableCellEdit`

`TableCellEdit` renders a single-purpose edit button cell — used when the only row action is "open in detail view". Generic over the row type.

## Features

- Compact pencil icon button
- Emits `edit` with the row data

## Usage

```ts
{
  id: 'actions',
  cell: ({ row }) =>
    h(TableCellEdit, {
      rowData: row.original,
      onEdit: (data) => goToEdit(data._id),
    }),
}
```

## Props

### `rowData`

```ts
rowData: T
```

The full row passed back through the `edit` event.

## Events

### `edit`

```ts
(rowData: T): T
```

Emitted when the user clicks the button.
