# `TableCellFlag`

`TableCellFlag` renders a country flag + label cell — circular flag icon next to a name, used for country/market columns.

## Features

- Circular flag image driven by the country code (via the `flagClass` utility)
- Label text in standard cell styling
- Empty `code` renders just the label

## Usage

```ts
{
  id: 'country',
  cell: ({ row }) =>
    h(TableCellFlag, {
      code: row.original.country.code,
      label: row.original.country.name,
    }),
}
```

## Props

### `code`

```ts
code: string
```

ISO country code (`'SE'`, `'NO'`). Empty string skips the flag.

### `label`

```ts
label: string
```

Visible label next to the flag.

## Dependencies

- `flagClass` utility — produces the Tailwind class for the country flag background
