# `AssetThumbnail`

`AssetThumbnail` renders an asset's preview: the image when a `thumbUrl` is present, otherwise a typed icon block (icon + label) for non-image types.

## Usage

```vue
<!-- grid card -->
<AssetThumbnail
  :type="asset.type"
  :thumb-url="asset.thumbUrl"
  :alt="asset.name"
/>

<!-- list row -->
<AssetThumbnail :type="asset.type" :thumb-url="asset.thumbUrl" size="row" />
```

## Props

### `type`

```ts
type: AssetType;
```

Used for the icon-block fallback and its label.

### `thumbUrl`

```ts
thumbUrl?: string | null
```

Image URL. When present the image renders (`object-cover`); when absent the typed icon block is shown.

### `alt`

```ts
alt?: string
```

Image alt text. Defaults to an empty string (decorative).

### `size`

```ts
size?: 'card' | 'row'
```

- **Default:** `'card'`

`card` = 3:2 responsive tile (grid). `row` = small square (list rows); the label is hidden at `row` size.

## Dependencies

- [`useAssetType`](/composables/useAssetType) — icon + label
- [`useLucideIcon`](/composables/useLucideIcon) — resolves the icon component
