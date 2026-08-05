# `AssetDetailPanel`

`AssetDetailPanel` is the slide-in detail/edit panel for a single asset, built on [`PanelEdit`](/components/panel/PanelEdit). It edits the asset's metadata and shows read-only info; the library page opens it from a grid card or list row.

It is the first real consumer of the `PanelEdit` primitive — the unsaved-changes guard comes from vee-validate's `meta.dirty` fed into `PanelEdit`.

## Usage

```vue
<AssetDetailPanel
  v-model:open="detailOpen"
  :asset="detailAsset"
  @updated="refresh"
/>
```

The page sets `detailAsset` + `detailOpen` in `openAsset(asset)`.

## Props

### `asset`

```ts
asset: Asset | null;
```

The asset to edit. The form resets from it each time the panel opens.

## v-model

### `open`

```ts
v-model:open: boolean
```

## Events

### `updated`

Emitted after a successful save (the page refreshes the library list).

## Editable fields

- **name** (required), **folder** (`Select` from [`useFolders`](/composables/useFolders) with inline create), **description** (`Textarea`), **alt text** (images only — inline input for the current language + a translate button that opens [`PanelTranslation`](/components/panel/PanelTranslation) stacked over the panel), **tags** (`TagsInput`), **channels** ([`FormInputChannels`](/components/form/input/FormInputChannels)).
- Save → `assetApi.update(id, …)` → refresh `asset-library-list`.

## Read-only info

Preview ([`AssetThumbnail`](/components/asset/AssetThumbnail)), type badge, size, created / modified, created by.

## Not here

Copy/download/delete actions and replace-file are separate changes.
