# `useAssetType`

The `useAssetType` composable is the single source of presentation metadata for an `AssetType` — its i18n label key, `Badge` color variant, and Lucide icon name. Grid cards, list rows, type badges, and thumbnails all read from it so they stay consistent.

## Usage

```ts
const { meta, label } = useAssetType();

meta('pdf'); // { labelKey: 'asset_type.pdf', variant: 'pink', icon: 'FileText', tint: 'bg-tone-pink/10 text-tone-pink' }
label('pdf'); // 'PDF' (localized)
```

Unknown types fall back to the `other` entry.

## Returns

### `meta`

```ts
meta(type: AssetType): { labelKey: string; variant: BadgeVariants['variant']; icon: string; tint: string }
```

Presentation metadata for a type.

### `label`

```ts
label(type: AssetType): string
```

The localized type label (resolves `meta(type).labelKey`).

## Type map

| Type    | Variant   | Icon       |
| ------- | --------- | ---------- |
| `image` | `info`    | `Image`    |
| `svg`   | `teal`    | `Shapes`   |
| `doc`   | `slate`   | `FileText` |
| `pdf`   | `pink`    | `FileText` |
| `video` | `purple`  | `Film`     |
| `audio` | `warning` | `Music`    |
| `other` | `neutral` | `File`     |

Image and Audio reuse the info and warning status tones on purpose; the rest use the tag tones (see [Colors](/guides/ui/colors)). `tint` (the thumbnail placeholder) uses the same color as the badge.

## Consumed by

- [`AssetTypeBadge`](/components/asset/AssetTypeBadge)
- [`AssetThumbnail`](/components/asset/AssetThumbnail)
