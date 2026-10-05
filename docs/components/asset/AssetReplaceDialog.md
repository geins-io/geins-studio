# `AssetReplaceDialog`

`AssetReplaceDialog` overwrites an asset's file in place — same id, path, name, metadata, and references. Drop or pick a single file, then confirm with **Replace everywhere**, and it calls `assetApi.replace(id, file)`: `POST /media/assets/{id}/replace` claims a one-file ticket, and the bytes go through the same PUT + `complete` as an upload (see the [assets domain](/domains/assets)). A warning [`Feedback`](/components/Feedback) notes that replacing updates the asset everywhere it's used.

## File type rule

The path never changes, so the new file must keep the asset's extension or an alias for the same type (`.jpg` for a `.jpeg` asset) — `replaceExtensions(asset.name)` from `#shared/utils/asset`. The dialog:

- sets the file input's `accept` to those extensions, and names them in the drop zone hint;
- re-checks a dropped file (a drop bypasses `accept`) and shows a negative `Feedback` instead of letting **Replace everywhere** run.

An asset without an extension skips the client-side check; the backend still answers `422` for a mismatch.

## Errors

Failures show inline as a negative `Feedback` (the call passes `suppressErrorToast: true`), always ending with "The original file was kept." — a rejected replacement is rolled back server-side:

- the claim's `404` / `409` / `422` → `replaceErrorMessageKey(status)`;
- a completion rejection (`FILE_TYPE_NOT_ALLOWED` also fires when the bytes contradict the extension) → `uploadRejectionMessageKey(code)`, the same copy as uploads.

## After success

The asset is refetched with `assetApi.get` (falling back to the completed row) so the preview gets the new `url` version and the caller gets the new `etag`; `asset-library-list` is refreshed and a success toast shown.

It is rendered **inside** the [`AssetDetailPanel`](/components/asset/AssetDetailPanel) (from its `Replace` action) so it stays within the panel's modal subtree — a page-level dialog would be hidden by the sheet's `hideOthers`.

## Usage

```vue
<AssetReplaceDialog
  v-model:open="replaceOpen"
  :asset="asset"
  @replaced="(updated) => emit('replaced', updated)"
/>
```

The detail panel advances its held etag from the emitted asset (so its next `PATCH` doesn't fail `If-Match`) and forwards `replaced` up so the page can update its `detailAsset` — the preview refreshes, because the new `url` carries a new `?v=` that `assetPreviewUrl` keeps.

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

Emitted with the refetched asset after a successful replace.

## Dependencies

- [`useGeinsRepository`](/composables/useGeinsRepository) — `assetApi.replace`, `assetApi.get`
- `replaceExtensions`, `isReplaceExtensionAllowed`, `replaceErrorMessageKey`, `uploadRejectionMessageKey` (`#shared/utils/asset`)
- [`Feedback`](/components/Feedback), [`AssetFileRow`](/components/asset/AssetFileRow)
- shadcn-vue [`Dialog`](/components/shadcn-vue), `Button`; [`ButtonIcon`](/components/button/ButtonIcon)
- `useToast` — success toast; `formatFileSize` (`#shared/utils/file`)
