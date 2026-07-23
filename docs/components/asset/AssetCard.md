# `AssetCard`

`AssetCard` is the grid-view tile for a single asset: a 3:2 thumbnail, name, type badge, optional folder, tags, and size/modified meta. Clicking the name, the card, or the hover action menu opens the asset.

:::tip NOTE
Selection and bulk actions are deferred post-v0, so there is no select checkbox yet. "Used in" is also deferred (no data).
:::

## Usage

```vue
<AssetCard
  :asset="asset"
  :folder-name="folderNameById(asset.folderId)"
  @open="openDetail(asset)"
/>
```

The responsive grid is the page's responsibility (e.g. `grid` with `repeat(auto-fill, minmax(260px, 1fr))`), not the card's.

## Props

### `asset`

```ts
asset: Asset;
```

The asset to render.

### `folderName`

```ts
folderName?: string
```

Resolved folder name — the asset only carries `folderId`, so the page resolves the name (from the folder list) and passes it. The folder row is hidden when omitted.

## Events

### `open`

Emitted when the name, the action menu's "View details" item is clicked. The page maps this to opening the detail panel.

## Dependencies

- [`AssetThumbnail`](/components/asset/AssetThumbnail), [`AssetTypeBadge`](/components/asset/AssetTypeBadge)
- shadcn-vue [`Card`](/components/shadcn-vue), `Badge`, `Button`, `DropdownMenu`
- [`useDate`](/composables/useDate) — modified date; `formatFileSize` (`#shared/utils/file`) — size
