# `TableCellEditable`

`TableCellEditable` is an in-place editable cell — renders an `Input` bound to a column value, with optional unit suffix and percentage formatting. Emits both `change` (live) and `blur` (committed). Generic over the row type.

## Features

- Reads the initial value via `row.getValue(colKey)`
- Three input types via `EditableColumnType`: `text`, `number`, `percentage` (auto-appends `%` suffix)
- Custom unit suffix via `valueDescriptor` (e.g. `'kg'`, `'mm'`)
- `Enter` blurs the input — common spreadsheet shortcut to commit
- Emits `change` on every edit, `blur` only when the value actually differs from initial

## Usage

```ts
{
  id: 'discount',
  accessorKey: 'discount',
  cell: ({ table, row, column }) =>
    h(TableCellEditable, {
      table,
      row,
      column,
      colKey: 'discount',
      type: 'percentage',
      onBlur: (value, row) => updateRow(row.original._id, { discount: value }),
    }),
}
```

## Props

### `table`, `row`, `column`

```ts
table: Table<T>
row: Row<T>
column: Column<T>
```

TanStack instances passed from the cell context.

### `colKey`

```ts
colKey: string
```

Field key used for the `Label` `for` attribute and the initial value lookup.

### `type`

```ts
type: EditableColumnType  // 'text' | 'number' | 'percentage'
```

Input handling. `'number'` parses to float; `'percentage'` parses to float and forces the `%` suffix.

### `valueDescriptor`

```ts
valueDescriptor?: string
```

Custom suffix shown in the input's `valueDescriptor` slot. Overridden to `'%'` when `type === 'percentage'`.

### `initialValue`

```ts
initialValue?: string | number
```

Override the value read from `row.getValue(colKey)` (e.g. for a parallel state model).

### `placeholder`

```ts
placeholder?: string
```

Placeholder text.

## Events

### `change`

```ts
(newValue: string | number, row: Row<T>): void
```

Emitted on every input change.

### `blur`

```ts
(newValue: string | number, row: Row<T>): void
```

Emitted on blur, **only** when the value differs from the initial. Use this to commit to the API.

## Dependencies

- shadcn-vue `Input`, `Label`
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) for the `table`/`row`/`column` types
