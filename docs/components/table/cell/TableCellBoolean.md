# `TableCellBoolean`

`TableCellBoolean` renders a yes/no cell — green check + "Yes" or red X + "No", with localized labels.

## Features

- Lucide `Check` (positive) / `X` (negative) icon plus the localized label
- No interaction — display-only

## Usage

```ts
{
  id: 'verified',
  cell: ({ row }) => h(TableCellBoolean, { isTrue: row.original.verified }),
}
```

## Props

### `isTrue`

```ts
isTrue: boolean
```

`true` renders the positive variant; `false` renders the negative variant.
