# `TableCellStatus`

`TableCellStatus` is the standard status cell — a thin wrapper around [`StatusBadge`](/components/StatusBadge) so the status palette and labelling stay consistent between badges in cards and badges in table rows.

## Features

- Identical look to [`StatusBadge`](/components/StatusBadge) — same variant map, same i18n
- Wrapped in a div so cell padding/alignment matches surrounding columns

## Usage

```ts
{
  id: 'status',
  cell: ({ row }) => h(TableCellStatus, { status: row.original.status }),
}
```

## Props

### `status`

```ts
status: StatusBadgeStatus
```

Status value. See [`StatusBadge`](/components/StatusBadge) for the full union.

## Dependencies

- [`StatusBadge`](/components/StatusBadge)
