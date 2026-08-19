# `AssetActionsMenu`

`AssetActionsMenu` is the shared asset context menu — a `DropdownMenu` with **View details**, **Download**, **Copy public URL**, and **Delete**. Both the grid-view [`AssetCard`](/components/asset/AssetCard) and the list-view actions column render it, so the two views stay in sync.

Download and Copy URL are disabled when the asset has no public `url`.

## Usage

```vue
<AssetActionsMenu
  :asset="asset"
  @open="openDetail(asset)"
  @download="download(asset)"
  @copy-url="copyUrl(asset)"
  @delete="requestDelete(asset)"
/>
```

In a TanStack Table cell (rendered via `h()`), pass `trigger: 'table'` and the `on*` handlers:

```ts
h(AssetActionsMenu, {
  asset: row.original,
  trigger: 'table',
  onOpen: () => openAsset(row.original),
  onDownload: () => download(row.original),
  onCopyUrl: () => copyUrl(row.original),
  onDelete: () => requestDelete(row.original),
});
```

## Props

### `asset`

```ts
asset: Asset;
```

The asset the menu acts on. Its `url` drives whether Download / Copy URL are enabled.

### `trigger`

```ts
trigger?: 'card' | 'table'; // default 'card'
```

Trigger button styling: `'card'` is the floating secondary chip used on the grid card (hover ellipsis); `'table'` is the compact outline button used in a list-view actions column (matching other list pages).

## Events

### `open`

"View details" — the page opens the detail panel.

### `download` / `copyUrl`

Download the file / copy its public URL. Disabled when the asset has no `url`.

### `delete`

Request deletion — the page opens the confirm dialog for this asset.

## Dependencies

- shadcn-vue `DropdownMenu`, `Button`
- Consumers wire events to [`useAssetActions`](/composables/useAssetActions) + a shared [`DialogDelete`](/components/dialog/DialogDelete)
