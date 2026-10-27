# `PriceListVolumePricingCell`

`PriceListVolumePricingCell` is the per-product volume-pricing summary cell in the price-list table — shows the count of price breaks with a tooltip preview, plus an Edit / Add button that opens [`PriceListVolumePricingPanel`](/components/price-list/PriceListVolumePricingPanel).

## Features

- Two states:
  - **Has rules:** count + tooltip with a quantity / margin / discount / price preview table; trailing pencil button
  - **No rules:** muted `0` + trailing plus button
- Both buttons emit `edit` with `{ id, name }` so the parent can open the editor sheet pre-filtered to this product
- `readonly` mode shows the count as a link that emits `edit` (open a read-only panel) when above 0, or a muted `0` with no link — no tooltip or edit/add button. Used by read-only price grids

## Usage

```ts
{
  id: 'volumePricing',
  cell: ({ row }) =>
    h(PriceListVolumePricingCell, {
      id: row.original._id,
      name: row.original.name,
      volumePricing: row.original.volumePricing ?? [],
      vatDescription: vatDescription,
      onEdit: ({ id, name }) => openVolumePricing(id, name),
    }),
}
```

## Props

### `id`

```ts
id: string;
```

Product `_id` carried back through the `edit` event.

### `name`

```ts
name: string;
```

Product name (used in the edit event payload + sheet title downstream).

### `volumePricing`

```ts
volumePricing: PriceListRule[]
```

The product's volume-break rules. Drives the count and the tooltip preview.

### `vatDescription`

```ts
vatDescription: string;
```

Localized VAT descriptor shown in the tooltip's price column header.

### `className`

```ts
className?: string
```

Extra Tailwind classes for the wrapper.

### `readonly`

```ts
readonly?: boolean
```

Shows the tier count only: a link emitting `edit` when above 0, a muted `0` otherwise. No tooltip or edit/add button. Set by `addVolumePricingColumn(..., readonly)`.

## Events

### `edit`

```ts
(payload: { id: string; name: string }): void
```

Emitted when either the pencil or plus button is clicked.

## Dependencies

- [`ContentTextTooltip`](/components/content/text/ContentTextTooltip)
- shadcn-vue `Button`
