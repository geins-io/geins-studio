# `AssetPickerPanel`

`AssetPickerPanel` is a wide slide-in panel for **choosing assets from the library to link onto an entity** (product images, media & files, content blocks…). It browses the same library the [asset library page](/domains/assets) shows — folders, search, grid/list, pagination — and returns the picked assets. It **links, it does not copy**: the library stays the single source of truth.

It is composed from the existing asset pieces ([`AssetFolderTree`](/components/asset/AssetFolderTree), [`AssetCard`](/components/asset/AssetCard) in `selectable` mode, [`TableView`](/components/table/TableView), [`PaginationBar`](/components/PaginationBar)) plus a selection layer.

:::tip NOT a `PanelEdit`
A picker has no unsaved-changes semantics, so it uses a plain wide [`Sheet`](/components/shadcn-vue) (`SheetContent width="wide"`, same 1310px as the Selector) with a custom footer — not [`PanelEdit`](/components/panel/PanelEdit).
:::

## Usage

```vue
<AssetPickerPanel
  v-model:open="pickerOpen"
  :types="['image']"
  :preselected-ids="linkedIds"
  @confirm="onPicked"
/>
```

```ts
function onPicked(assets: Asset[]) {
  // link the returned assets onto the entity — the picker never writes to them
}
```

You rarely render `AssetPickerPanel` directly. The public trigger API — [`useAssetPicker`](/composables/useAssetPicker) (imperative service), [`AssetPickerHost`](/components/asset/AssetPickerHost) (single global instance), and [`AssetPicker`](/components/asset/AssetPicker) (declarative wrapper) — drives one shared instance app-wide. Prefer those.

## Props

### `multiple`

```ts
multiple?: boolean; // default true
```

Single vs multi-select. In single mode a new pick **replaces** the selection and the list-view select-all is not used.

### `types`

```ts
types?: AssetType[] | null; // default null
```

Allowed asset types. `null` = all; `['image']` = images only; a subset (e.g. `['video', 'pdf', 'doc', 'svg', 'audio']`) = files. Assets outside `types` are filtered out entirely. The default view is **grid** for image pickers and **list** for files-only pickers (a `types` set that excludes `'image'`).

### `preselectedIds`

```ts
preselectedIds?: string[]; // default []
```

Already-linked assets: shown pre-checked with a "linked" badge. The confirm button counts only **new** picks (it stays disabled until at least one new asset is selected).

### `title`

```ts
title?: string;
```

Panel heading. Defaults to a generic "select assets".

### `folderId`

```ts
folderId?: string | null; // default null
```

Initial folder scope (the server-side filter). `null` starts at all assets.

## v-model

### `open`

```ts
defineModel<boolean>('open'); // default false
```

Visibility. Each time it flips **true** the panel resets its transient state (view, folder, search, type chip, selection ← `preselectedIds`, page) and refetches.

## Events

### `confirm`

```ts
confirm: [assets: Asset[]];
```

Emitted from the footer's "add" button with the full selected `Asset` objects (including any still-selected preselected ones). The panel closes itself afterward.

## Inline quick-upload

The **Upload new** button in the Library header bar (above the folder-rail / browse split) opens [`AssetUploadDialog`](/components/asset/AssetUploadDialog) constrained to quick-only (`:methods="['quick']"`) — the wizard is withheld because it routes away and would abandon the picker/entity context. The picker's `folderId` seeds the upload's default folder, and `multiple` is forwarded so a single-select picker uploads a single file.

On the dialog's `uploaded` event the panel:

1. **Seeds** the new assets into its resolve map (so the selection resolves them before the refetch lands),
2. **Auto-selects** the uploaded assets whose type matches `types` — added to the current selection when `multiple`, or the first match alone when single-select,
3. **Flips the rail to "Recently added"** so the user sees what they just added, and
4. **Refetches** the library list.

The picker goes through `assetApi.upload` (via the dialog), not a specific transport, so the mock → Geins.Media cutover stays mechanical.

## Data

Reads `assetApi.list({ folderId })` via [`useGeinsRepository`](/composables/useGeinsRepository) in `useAsyncData` (folder scope stays server-side, matching the library page). Search, type filtering, "recently added" sorting, and pagination are client-side over the fetched list. Selected assets are remembered across folder switches so a confirm returns picks made in more than one folder.

## Dependencies

- [`AssetFolderTree`](/components/asset/AssetFolderTree), [`AssetCard`](/components/asset/AssetCard) (`selectable` / `hide-actions`), [`AssetThumbnail`](/components/asset/AssetThumbnail), [`AssetTypeBadge`](/components/asset/AssetTypeBadge)
- [`TableView`](/components/table/TableView) (Simple mode + `select` column via [`useColumns`](/composables/useColumns)), [`PaginationBar`](/components/PaginationBar)
- [`AssetUploadDialog`](/components/asset/AssetUploadDialog) — inline quick-upload (`:methods="['quick']"`)
- shadcn-vue `Sheet` / `SheetContent` (`width="wide"`), `Sidebar`, `Button`, `ButtonGroup`, `Badge`, `Input`, `Empty`
- [`useAssetType`](/composables/useAssetType) — type chip labels; [`useFolders`](/composables/useFolders) — folder names
