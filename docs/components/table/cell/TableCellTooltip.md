# `TableCellTooltip`

`TableCellTooltip` renders a value with an attached tooltip — uses `ContentTextTooltip` when enabled, falls back to muted plain text when `disabled`.

## Features

- Two display modes via `disabled`: tooltip-on-hover or muted plain text
- Spreads the `Tooltip` shape (`displayValue`, `contentValue`, `disabled`)

## Usage

```ts
{
  id: 'reference',
  cell: ({ row }) =>
    h(TableCellTooltip, {
      displayValue: row.original.shortRef,
      contentValue: row.original.fullRef,
      disabled: !row.original.fullRef,
    }),
}
```

## Props

Spreads the `Tooltip` shape:

### `displayValue`

```ts
displayValue: string
```

Always-visible value.

### `contentValue`

```ts
contentValue: string
```

Tooltip content (only shown when `disabled` is `false`).

### `disabled`

```ts
disabled?: boolean
```

When `true`, suppresses the tooltip and renders `displayValue` muted.

## Type Definitions

```ts
interface Tooltip {
  displayValue: string;
  contentValue: string;
  disabled?: boolean;
}
```

## Dependencies

- `ContentTextTooltip` (documented in a later phase)
