# `useAssetType`

The `useAssetType` composable is the single source of presentation metadata for an `AssetType` — its i18n label key, `Badge` color variant, and Lucide icon name. Grid cards, list rows, type badges, and thumbnails all read from it so they stay consistent.

## Usage

```ts
const { meta, label } = useAssetType();

meta('pdf'); // { labelKey: 'asset_type.pdf', variant: 'rose', icon: 'FileText' }
label('pdf'); // 'PDF' (localized)
```

Unknown types fall back to the `other` entry.

## Returns

### `meta`

```ts
meta(type: AssetType): { labelKey: string; variant: BadgeVariants['variant']; icon: string }
```

Presentation metadata for a type.

### `label`

```ts
label(type: AssetType): string
```

The localized type label (resolves `meta(type).labelKey`).

## Type map

| Type    | Variant  | Icon       |
| ------- | -------- | ---------- |
| `image` | `blue`   | `Image`    |
| `svg`   | `teal`   | `Shapes`   |
| `doc`   | `indigo` | `FileText` |
| `pdf`   | `rose`   | `FileText` |
| `video` | `purple` | `Film`     |
| `audio` | `amber`  | `Music`    |
| `other` | `slate`  | `File`     |

## Consumed by

- [`AssetTypeBadge`](/components/asset/AssetTypeBadge)
- [`AssetThumbnail`](/components/asset/AssetThumbnail)
