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

Emitted after a successful save **or delete** (the page refreshes the library list).

### `replaced`

```ts
replaced: [asset: Asset];
```

Emitted with the updated asset after a file replace; the page sets `detailAsset` to it so the preview refreshes.

## Actions

An action row under the preview:

- **Copy URL** — writes the asset's `url` to the clipboard (`entity_copied` toast); disabled when the asset has no `url`.
- **Download** — anchor `download` of `url` (falls back to opening in a new tab); disabled when there is no `url`.
- **Replace** — opens [`AssetReplaceDialog`](/components/asset/AssetReplaceDialog) to swap the underlying file (same id + metadata).

Footer: **Delete asset** (destructive, left) opens [`DialogDelete`](/components/dialog/DialogDelete) → `assetApi.delete(id)` → refresh `asset-library-list` + toast + close; **Save** (right).

## Editable fields

- **name** (required), **folder** (`Select` from [`useFolders`](/composables/useFolders) with inline create), **description** (`Textarea`), **alt text** (images only — inline input for the current language + a translate button that opens [`PanelTranslation`](/components/panel/PanelTranslation) stacked over the panel), **tags** (`TagsInput`), **channels** ([`FormInputChannels`](/components/form/input/FormInputChannels)).
- Alt text is edited as a locale→string map in the form, then written as `localizations` (`{ [lang]: { altText } }`) on save — the product-standard shape (see [assets domain](/domains/assets)).
- Save → `assetApi.update(id, …)` → refresh `asset-library-list`.

## Read-only info

Preview ([`AssetThumbnail`](/components/asset/AssetThumbnail)), type badge, size, created / modified, created by.

## Not here

Replace-file is a separate change (STU-289).
