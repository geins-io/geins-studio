# `TableCellAssetThumbnail`

`TableCellAssetThumbnail` renders an asset's thumbnail inside a table cell — the image when a `thumbUrl` is present (falling back to a typed icon block on load error), otherwise a typed icon block tinted with the asset-type color.

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
      thumbUrl: row.original.thumbUrl,
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

### `thumbUrl`

```ts
thumbUrl?: string | null
```

Image URL. When absent (or it fails to load) the typed icon block is shown.

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

`thumbUrl` is preferred; when it is empty the cell previews the asset's full-size `url`, but only for `image`/`svg` types — shared with [`AssetThumbnail`](/components/asset/AssetThumbnail) via `assetPreviewUrl` in `shared/utils/asset.ts`. Pass both props:

```ts
h(TableCellAssetThumbnail, {
  type: row.original.type,
  thumbUrl: row.original.thumbUrl,
  url: row.original.url,
  alt: row.original.name,
  className: getBasicCellStyle(table),
});
```

Geins.Media phase 1 serves no thumbnails, so without `url` every row renders a type icon.
