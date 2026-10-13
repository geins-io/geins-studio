# `useAssetActions`

`useAssetActions` bundles the shared asset row/panel actions — **copy URL**, **download**, **delete**, **restore**, and **purge** — so the library page, the grid [`AssetCard`](/components/asset/AssetCard), and the [`AssetDetailPanel`](/components/asset/AssetDetailPanel) stay consistent.

:::tip NOTE
`deleteAsset`, `restoreAsset` and `purgeAsset` refresh the `asset-library-list` read and toast on their own (`purgeAsset` once its background job lands), but callers own the surrounding UI — the confirm dialog ([`DialogDelete`](/components/dialog/DialogDelete)), closing a panel, clearing a pending selection.
:::

## Usage

```ts
const { copyUrl, download, deleteAsset } = useAssetActions();

// direct actions
await copyUrl(asset);
download(asset);

// delete behind a confirm dialog
async function confirmDelete() {
  const ok = await deleteAsset(pendingDelete.value);
  if (ok) deleteOpen.value = false;
}
```

## Returns

### `copyUrl`

```ts
copyUrl: (asset: Asset) => Promise<void>;
```

Writes the asset's public `url` to the clipboard and toasts (`entity_copied`). No-op when the asset has no `url`.

### `download`

```ts
download: (asset: Asset) => void;
```

Triggers an anchor download of the asset's `url` (cross-origin storage URLs fall back to opening in a new tab). No-op when there is no `url`.

### `deleteAsset`

```ts
deleteAsset: (asset: Asset) => Promise<boolean>;
```

Moves the asset to trash (`assetApi.delete`), refreshes `asset-library-list`, and toasts (`entity_moved_to_trash`). Returns `true` on success, `false` on failure (the error surfaces via the global API-error toast). Callers close their dialog / panel on `true`.

`Geins.Media` moves the asset to **trash** rather than dropping it, so every caller uses the soft "Move to trash" copy — see [assets](/domains/assets#delete-vocabulary).

### `restoreAsset`

```ts
restoreAsset: (asset: Asset) => Promise<boolean>;
```

Restores a trashed asset (`assetApi.restore` → `POST /media/assets/{id}/restore`), refreshes `asset-library-list`, `asset-folders` and `asset-trash-folders` (if the asset's folder is in the trash, the backend brings that folder and its trashed parents back too, without their other contents), and toasts (`entity_restored`). Returns `true` on success. The refresh is what removes the row from the Trash view, so callers need no local bookkeeping.

### `purgeAsset`

```ts
purgeAsset: (asset: Asset) => Promise<boolean>;
```

Permanently deletes a trashed asset (`assetApi.bulkPurge([id])` → `POST /media/assets/bulk-purge`; there is no single-asset route). Returns `true` once the call went through. The purge lands about a minute after the call, so it starts a `purge` [background job](/composables/useBackgroundJobs) ("Deleting {name} permanently") that refreshes `asset-library-list` and toasts `entity_deleted` once the asset has left the trash. Callers confirm first with the **hard** copy — see [assets](/domains/assets#delete-vocabulary).

## Dependencies

- [`useGeinsRepository`](/composables/useGeinsRepository) — `assetApi`
- `useToast` — success toasts
- [`useBackgroundJobs`](/composables/useBackgroundJobs) — the purge job
