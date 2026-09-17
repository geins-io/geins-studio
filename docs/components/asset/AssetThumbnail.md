# `AssetThumbnail`

`AssetThumbnail` renders an asset's preview: the thumbnail when the backend serves one, the full-size file for `image`/`svg` assets when it doesn't, otherwise a typed icon block (icon + label). The fallback matters against Geins.Media phase 1, which returns `thumbUrl: ''` on every asset but a usable `url` — without it the whole library renders as icons.

## Usage

```vue
<!-- grid card -->
<AssetThumbnail
  :type="asset.type"
  :thumb-url="asset.thumbUrl"
  :url="asset.url"
  :alt="asset.name"
/>

<!-- list row -->
<AssetThumbnail
  :type="asset.type"
  :thumb-url="asset.thumbUrl"
  :url="asset.url"
  size="row"
/>
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

Thumbnail URL. Preferred when present (`object-cover`).

### `url`

```ts
url?: string | null
```

The asset's full-size file, used as the preview when there is no `thumbUrl` — but only for types a browser can render in an `<img>` (`image`, `svg`). A PDF or video falls through to the icon block. Source of truth: [`assetPreviewUrl`](shared/utils/asset.ts). An image that 404s also falls back to the icon.

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
