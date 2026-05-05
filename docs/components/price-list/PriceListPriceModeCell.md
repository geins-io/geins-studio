# `PriceListPriceModeCell`

`PriceListPriceModeCell` is a one-letter cell with a tooltip that explains how the row's price is set — `M` (manually), `G` (globally by a rule), or `D` (default). Used in the price-list products table next to each price.

## Features

- Single dashed-underline letter color-coded by mode: `M` warning, `G` blue, `D` muted
- Tooltip shows the localized full description on hover
- Maps `PriceListPriceMode` values to one of three letters

## Mode → letter

| `priceMode` | Letter |
| --- | --- |
| `fixed`, `margin`, `discount` | `M` |
| `rule`, `autoRule` | `G` |
| `auto` (or anything else) | `D` |

## Usage

```ts
{
  id: 'priceMode',
  cell: ({ row }) =>
    h(PriceListPriceModeCell, { priceMode: row.original.priceMode }),
}
```

## Props

### `priceMode`

```ts
priceMode: PriceListPriceMode
```

The product's current price mode.

### `className`

```ts
className?: string
```

Extra Tailwind classes for the wrapper.

## Dependencies

- shadcn-vue [`Tooltip`](/components/shadcn-vue)
