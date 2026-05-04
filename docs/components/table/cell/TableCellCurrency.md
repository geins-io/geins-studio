# `TableCellCurrency`

`TableCellCurrency` renders a price cell — the currency code in a muted left rail and the formatted price beside it. Routes the value through [`usePrice().formatCurrency`](/composables/usePrice) so locale separators stay consistent across the app.

## Features

- Currency-code rail on the left, formatted amount on the right
- Renders `'---'` literally for unknown / missing prices (muted)
- Uses [`usePrice`](/composables/usePrice) for locale-aware number formatting

## Usage

```ts
{
  id: 'totalPrice',
  cell: ({ row }) => h(TableCellCurrency, row.original.totalPrice),  // Price object
}
```

## Props

Spreads the `Price` shape:

### `currency`

```ts
currency: string
```

Currency code (e.g. `'SEK'`, `'EUR'`).

### `price`

```ts
price: string
```

Numeric string (`'1234.56'`) or the literal `'---'` for unknown.

## Type Definitions

```ts
interface Price {
  currency: string;
  price: string;
}
```

## Dependencies

- [`usePrice`](/composables/usePrice) — `formatCurrency`
