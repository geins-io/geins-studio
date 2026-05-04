# `TableCellProduct`

`TableCellProduct` is the product row cell — square thumbnail, product name on top, optional article number below. Used in any list that shows products (orders, quotations, price lists).

## Features

- 40px thumbnail via [`useGeinsImage().getProductThumbnail`](/composables/useGeinsImage)
- Image error fallback via `handleImageError`
- Truncated name + article number (single-line each)
- Renders without a thumbnail when `imageUrl` is empty (the fallback URL is still produced)

## Usage

```ts
{
  id: 'product',
  cell: ({ row }) =>
    h(TableCellProduct, {
      name: row.original.name,
      articleNumber: row.original.articleNumber,
      imageUrl: row.original.images?.[0]?.url,
    }),
}
```

## Props

### `name`

```ts
name: string
```

Product name (top line).

### `articleNumber`

```ts
articleNumber?: string
```

Article number rendered below the name.

- **Default:** `''`

### `imageUrl`

```ts
imageUrl?: string
```

Source URL for the thumbnail. Goes through `getProductThumbnail` so size/format normalization applies.

- **Default:** `''`

## Dependencies

- [`useGeinsImage`](/composables/useGeinsImage) — `getProductThumbnail`, `handleImageError`
