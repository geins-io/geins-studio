# `AssetTypeBadge`

`AssetTypeBadge` renders a colored pill for an asset's type — a thin wrapper over [`Badge`](/components/shadcn-vue) using the color variant and label from [`useAssetType`](/composables/useAssetType).

## Usage

```vue
<AssetTypeBadge type="pdf" />
<AssetTypeBadge type="image" size="default" />
```

## Props

### `type`

```ts
type: AssetType;
```

The asset type — drives both the color variant and the localized label.

### `size`

```ts
size?: 'default' | 'sm'
```

- **Default:** `'sm'`

Forwarded to `Badge`.

## Dependencies

- [`Badge`](/components/shadcn-vue) — tinted color variants
- [`useAssetType`](/composables/useAssetType) — variant + label
