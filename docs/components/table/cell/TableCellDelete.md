# `TableCellDelete`

`TableCellDelete` renders a single-purpose delete button cell — used when the only row action is "remove". Generic over the row type.

## Features

- Compact `X` button with `hover:text-negative`
- Disabled state for non-deletable rows
- Emits `delete` with the row data

## Usage

```ts
{
  id: 'actions',
  cell: ({ row }) =>
    h(TableCellDelete, {
      rowData: row.original,
      onDelete: (data) => removeRule(data._id),
    }),
}
```

## Props

### `rowData`

```ts
rowData: T
```

The full row passed back through the `delete` event.

### `disabled`

```ts
disabled?: boolean
```

Disables the button.

- **Default:** `false`

## Events

### `delete`

```ts
(rowData: T): T
```

Emitted when the user clicks the button.
