# `TableCellFlag`

`TableCellFlag` renders a country flag + label cell — circular flag icon next to a name, used for country/market columns.

## Features

- Thin wrapper around [`FlagIcon`](/components/FlagIcon) — same flag rendering as the rest of the app
- Empty `code` renders just the label without a flag

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
code: string;
```

ISO country code (`'SE'`, `'NO'`). Empty string skips the flag.

### `label`

```ts
label: string;
```

Visible label next to the flag.

## Dependencies

- [`FlagIcon`](/components/FlagIcon) — flag + label rendering
