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

Footer is the standard **Cancel + Save**. Deleting lives in a **remove section at the bottom of the panel** (like `CompanyBuyerPanel`): a `ContentCardHeader` + destructive **Remove** button → [`DialogDelete`](/components/dialog/DialogDelete) → `assetApi.delete(id)` → refresh `asset-library-list` + toast + close.

## Editable fields

- **name** (required), **folder** (`Select` from [`useFolders`](/composables/useFolders) with inline create), **description** (multi-line [`FormTranslatableField`](/components/form/FormTranslatableField) — `multiline`), **alt text** (images only — a [`FormTranslatableField`](/components/form/FormTranslatableField): current-language input + flag that opens the translation panel, which auto-stacks over this one), **tags** (`TagsInput`), **channels** ([`FormInputChannels`](/components/form/input/FormInputChannels)).
- **Description and alt text are both per-locale.** Each is edited as a locale→string map in the form; on save they merge into one `localizations` object (`{ [lang]: { description, altText } }`, blanks dropped) — the product-standard shape (see [assets domain](/domains/assets)). No top-level `description` is sent; the default-language value is derived server-side. Legacy rows whose description lived in the top-level column seed the current language on open so it isn't lost.
- Save → `assetApi.update(id, …)` → refresh `asset-library-list`.

## Optimistic concurrency

Save sends the loaded asset's `etag` as an `If-Match` header (via `RepoFetchOptions.headers`). If the asset changed elsewhere since it loaded, the update returns **`412`** — the global toast is skipped for `412`, and the panel shows an inline **warning `Alert`** ("changed elsewhere — reload") instead. **Reload** emits `updated` (the page re-fetches the list) and closes; the stale local edits are discarded, and reopening edits fresh data with the current etag. See the [assets domain](/domains/assets) concurrency note.

## Read-only info

Preview ([`AssetThumbnail`](/components/asset/AssetThumbnail)), type badge, size, created / modified, created by.

## Not here

Replace-file is a separate change (STU-289).
