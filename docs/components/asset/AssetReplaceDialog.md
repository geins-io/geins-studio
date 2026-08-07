# `AssetReplaceDialog`

`AssetReplaceDialog` swaps an asset's underlying file while keeping the same asset — id, name, metadata, and references. Drop or pick a single file, confirm, and it calls `assetApi.replace(id, formData)`.

It is rendered **inside** the [`AssetDetailPanel`](/components/asset/AssetDetailPanel) (from its `Replace` action) so it stays within the panel's modal subtree — a page-level dialog would be hidden by the sheet's `hideOthers`.

## Usage

```vue
<AssetReplaceDialog
  v-model:open="replaceOpen"
  :asset="asset"
  @replaced="(updated) => emit('replaced', updated)"
/>
```

The detail panel forwards `replaced` up so the page can update its `detailAsset` — the preview (new `url` / `thumbUrl`) refreshes immediately. The dialog also refreshes `asset-library-list` itself.

## Props

### `asset`

```ts
asset: Asset | null;
```

The asset whose file is being replaced.

## v-model

### `open`

```ts
v-model:open: boolean
```

## Events

### `replaced`

```ts
replaced: [asset: Asset];
```

Emitted with the updated asset after a successful replace.

## Dependencies

- [`useGeinsRepository`](/composables/useGeinsRepository) — `assetApi.replace`
- shadcn-vue [`Dialog`](/components/shadcn-vue), `Button`; [`ButtonIcon`](/components/button/ButtonIcon)
- `useToast` — success toast; `formatFileSize` (`#shared/utils/file`)
