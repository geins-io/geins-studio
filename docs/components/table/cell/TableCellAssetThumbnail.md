# `TableCellAssetThumbnail`

`TableCellAssetThumbnail` renders an asset's thumbnail inside a table cell — `image`/`svg` assets load their `url` (images scaled to the `row` CDN preset), falling back to a typed icon block on load error; other types get the icon block tinted with the asset-type color.

It matches the built-in `image` column type's size and style (a centered `size-7` thumbnail in a 40px column), so asset tables line up with other image columns.

## Usage

Use it as the `cell` renderer of a fixed-width column, passing `getBasicCellStyle(table)` as `className`:

```ts
const { getBasicCellStyle, getBasicHeaderStyle } = useColumns<Asset>();
const TableCellAssetThumbnail = resolveComponent('TableCellAssetThumbnail');

const thumbColumn: ColumnDef<Asset> = {
  id: 'thumb',
  enableSorting: false,
  size: 40,
  minSize: 40,
  maxSize: 40,
  meta: { type: 'image' },
  header: ({ table }) =>
    h('div', { class: cn(getBasicHeaderStyle(table), 'px-2') }),
  cell: ({ table, row }) =>
    h(TableCellAssetThumbnail, {
      type: row.original.type,
      url: row.original.url,
      alt: row.original.name,
      className: getBasicCellStyle(table),
    }),
};
```

## Props

### `type`

```ts
type: AssetType;
```

Drives the icon + tint of the fallback block.

### `url`

```ts
url?: string | null
```

The asset's file. When absent, not previewable, or it fails to load, the typed icon block is shown.

### `alt`

```ts
alt?: string
```

Image alt text. Defaults to the localized type label.

### `className`

```ts
className?: string
```

Cell wrapper classes — pass `getBasicCellStyle(table)` so padding/alignment match sibling columns.

## Dependencies

- [`useAssetType`](/composables/useAssetType) — icon, tint, and label per type
- [`useLucideIcon`](/composables/useLucideIcon) — resolves the fallback icon

## Preview source

Shared with [`AssetThumbnail`](/components/asset/AssetThumbnail) via `assetPreviewUrl(type, url, 'row')` in `shared/utils/asset.ts`. `image` URLs get `width=40&height=40&fit=crop&dpr=2` appended (80×80 output, enough for the 28px box on retina), keeping the existing `?v=` cache-buster. SVGs pass through untouched; other types never load an image.
