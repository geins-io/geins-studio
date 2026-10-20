# `AssetThumbnail`

`AssetThumbnail` renders an asset's preview: `image` assets load their file scaled by Fastly's image optimizer to the `size` preset, `svg` assets load their file as-is, and anything else gets a typed icon block (icon + label). Geins.Media serves no backend thumbnails — all scaling happens on the CDN through query params on `url`.

## Usage

```vue
<!-- grid card -->
<AssetThumbnail :type="asset.type" :url="asset.url" :alt="asset.name" />

<!-- list row -->
<AssetThumbnail :type="asset.type" :url="asset.url" size="row" />
```

## Props

### `type`

```ts
type: AssetType;
```

Used for the icon-block fallback and its label.

### `url`

```ts
url?: string | null
```

The asset's file. Only types a browser can render in an `<img>` (`image`, `svg`) preview; a PDF or video falls through to the icon block. `image` URLs get the `size` preset's Fastly params appended (the existing `?v=` cache-buster is kept, so a replaced file refreshes); SVGs are left untouched because the optimizer serves them unchanged. Source of truth: [`assetPreviewUrl`](shared/utils/asset.ts). An image that 404s also falls back to the icon.

### `alt`

```ts
alt?: string
```

Image alt text. Defaults to an empty string (decorative).

### `size`

```ts
size?: 'card' | 'banner' | 'row'
```

- **Default:** `'card'`

Sets both the box and the CDN preset (`ASSET_PREVIEW_PRESETS` in `shared/utils/asset.ts`), each rendered at `dpr=2` for retina:

| Size     | Box                          | Preset (`fit=crop&dpr=2`) |
| -------- | ---------------------------- | ------------------------- |
| `card`   | 3:2 responsive tile (grid)   | `width=420&height=280`    |
| `banner` | 2:1 full-width panel preview | `width=500&height=250`    |
| `row`    | 40px square (list rows)      | `width=40&height=40`      |

The label is hidden at `row` size. Every distinct query string is a separately cached and billed CDN variant, so the presets are a fixed set — don't add per-pixel sizes.

## Dependencies

- [`useAssetType`](/composables/useAssetType) — icon + label
- [`useLucideIcon`](/composables/useLucideIcon) — resolves the icon component
