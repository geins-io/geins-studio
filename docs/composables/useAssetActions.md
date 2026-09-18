# `useAssetActions`

`useAssetActions` bundles the shared asset row/panel actions — **copy URL**, **download**, **delete**, and **restore** — so the library page, the grid [`AssetCard`](/components/asset/AssetCard), and the [`AssetDetailPanel`](/components/asset/AssetDetailPanel) stay consistent.

:::tip NOTE
`deleteAsset` and `restoreAsset` refresh the `asset-library-list` read and toast on their own, but callers own the surrounding UI — the confirm dialog ([`DialogDelete`](/components/dialog/DialogDelete)), closing a panel, clearing a pending selection.
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

Deletes the asset (`assetApi.delete`), refreshes `asset-library-list`, and toasts (`entity_deleted`). Returns `true` on success, `false` on failure (the error surfaces via the global API-error toast). Callers close their dialog / panel on `true`.

How permanent the delete is belongs to the backend, not this composable: the mock drops the row, while `Geins.Media` moves the asset to **trash**. Either way it leaves the default library list, so the delete copy stays neutral on permanence — see [assets](/domains/assets).

### `restoreAsset`

```ts
restoreAsset: (asset: Asset) => Promise<boolean>;
```

Restores a trashed asset (`assetApi.restore` → `POST /media/assets/{id}/restore`), refreshes `asset-library-list`, and toasts (`entity_restored`). Returns `true` on success. Only reachable where `useAssetCapabilities().hasTrash` is on (the real backend) — the mock hard-deletes and has no restore route. The refresh is what removes the row from the Trash view, so callers need no local bookkeeping.

## Dependencies

- [`useGeinsRepository`](/composables/useGeinsRepository) — `assetApi`
- `useToast` — success toasts
