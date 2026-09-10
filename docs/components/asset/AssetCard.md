# `AssetCard`

`AssetCard` is the grid-view tile for a single asset: a 3:2 thumbnail, name, type badge, optional folder, tags, and size/modified meta. Clicking the name, the card, or the hover action menu opens the asset.

In `selectable` mode (the asset picker) the tile becomes a selection target instead: a checkbox overlays the thumbnail, clicking the tile toggles selection rather than opening the detail panel, and `hideActions` drops the actions menu.

:::tip NOTE
"Used in" is deferred (no data).
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

### `selectable`

```ts
selectable?: boolean; // default false
```

Picker mode. Renders a selection checkbox over the thumbnail (top-left) and makes the thumbnail + name toggle selection (emitting [`toggle-select`](#toggle-select)) instead of opening. Omitted → the default library tile.

### `selected`

```ts
selected?: boolean; // default false
```

Reflected selected state, driven by the parent. When set the tile shows a `ring-2 ring-primary` border and the checkbox stays visible. Only meaningful with `selectable`.

### `hideActions`

```ts
hideActions?: boolean; // default false
```

Suppress the [`AssetActionsMenu`](/components/asset/AssetActionsMenu) — the picker has selection only, no per-card open/download/delete.

## Events

The hover action menu is the shared [`AssetActionsMenu`](/components/asset/AssetActionsMenu); the card re-emits its per-action events and the page wires them to [`useAssetActions`](/composables/useAssetActions) + a shared [`DialogDelete`](/components/dialog/DialogDelete).

### `open`

Emitted from the thumbnail, the name, or the menu's "View details" item — the page opens the detail panel.

### `download` / `copyUrl`

Download the file / copy its URL. Disabled in the menu when the asset has no `url`.

### `delete`

Request deletion — the page opens the confirm dialog for this asset.

### `toggle-select`

Emitted in `selectable` mode from the checkbox, the thumbnail, or the name — the picker adds/removes the asset from its selection.

## List-view selection

The picker's list view reuses [`TableView`](/components/table/TableView) (Simple mode), which already supports row selection — no card-level work is needed there. Add the leading select column via `useColumns({ selectable: true })` (it injects a column with `id: 'select'`, which flips `TableView` into selectable mode with a header select-all), then drive it with the `selected-ids` prop and the `selection` event. Do **not** add checkboxes at the `ui/table/` primitive layer.

## Dependencies

- [`AssetThumbnail`](/components/asset/AssetThumbnail), [`AssetTypeBadge`](/components/asset/AssetTypeBadge), [`AssetActionsMenu`](/components/asset/AssetActionsMenu)
- shadcn-vue [`Card`](/components/shadcn-vue), `Badge`, `Button`
- [`useDate`](/composables/useDate) — modified date; `formatFileSize` (`#shared/utils/file`) — size
