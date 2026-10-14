# `AssetFolderTree`

`AssetFolderTree` is the folder-navigation tree for the Assets Library, built on the shadcn `Sidebar` primitives. Under a "Folders" header it shows **All assets**, then the nested folders (each expandable via a leading chevron; the folder icon opens when expanded/active), with the pinned **Uncategorised** and **Trash** views last, below the folder list. Each folder row offers **add subfolder** on hover and a `⋯` menu to **rename**, **move** or **delete** it (see [`AssetFolderTreeItem`](/components/asset/AssetFolderTreeItem#row-actions)).

Selection is emitted via `v-model:selected` — a folder id, `null` for **All assets**, `ROOT_FOLDER_KEY` (`'root'`, from `#shared/utils/asset`) for **Uncategorised**, `TRASH_KEY` (`'trash'`) for **Trash**, or `trashedFolderKey(id)` (`'trash:<id>'`) for one trashed folder. The consumer turns that into list options with `assetListOptions(selected)`; the tree itself only selects.

The **Trash** entry appears only outside `readonly` mode: the picker must never browse soft-deleted assets. When the trash holds folders, Trash gets a chevron and folds out to them — see [Trashed folders](#trashed-folders).

:::tip NOTE
**Uncategorised is a query, not a folder.** Geins.Media has no system folders — assets with no folder are `folderId: null`, and the query asks for them with `folderIds: [null]`. That is why the entry is pinned by the component rather than coming from the folder list, and why `assetListOptions` distinguishes "root only" (`folderId: null`) from "all assets" (no folder scope at all).
:::

:::warning
Must be rendered inside a `SidebarProvider` / `Sidebar` (the library page provides the layout, e.g. `Sidebar` + `SidebarInset`).
:::

## Usage

```vue
<SidebarProvider>
  <Sidebar>
    <AssetFolderTree v-model:selected="folderId" />
  </Sidebar>
  <SidebarInset>
    <!-- grid / list, filtered by folderId -->
  </SidebarInset>
</SidebarProvider>
```

## v-model

### `selected`

```ts
v-model:selected: string | null
```

The selected folder id, `null` for "All assets", `ROOT_FOLDER_KEY` for "Uncategorised" (assets with no folder), `TRASH_KEY` for the soft-deleted set, or `trashedFolderKey(id)` for one trashed folder's trashed contents. It is also the `?folder=` URL value on the library page, so every view deep-links.

## Props

### `readonly`

```ts
readonly?: boolean // default: false
```

Selection-only mode. When `true`, every folder **mutation** control is gated off: the per-node hover actions (**add subfolder** and the `⋯` menu), the top-level **New folder** input/button, and the dialogs — and the **Trash** entry is hidden. Selection + navigation still work.

The [`AssetPickerPanel`](/components/asset/AssetPickerPanel) passes `readonly` so a user browsing to pick an asset can't accidentally create or delete folders — folder management stays on the asset library page, which renders the tree with actions on (the default).

### `hideAll`

```ts
hideAll?: boolean // default: false
```

Hides the **All assets** entry, for when the tree picks a destination rather than a browse scope (an asset can't be moved to "all"). With `readonly` the tree then offers only real folders and **Uncategorised** (`ROOT_FOLDER_KEY`). Used by [`AssetBulkMoveFolder`](/components/asset/AssetBulkMoveFolder).

### `disabledIds`

```ts
disabledIds?: string[] // default: undefined
```

Selection keys that can't be picked: those folder rows (and **Uncategorised**, for `ROOT_FOLDER_KEY`) render disabled. A destination picker uses it. [`AssetFolderMoveDialog`](/components/asset/AssetFolderMoveDialog) passes a folder's own subtree plus its current parent.

## Renaming and moving a folder

Both go through `assetApi.folder.update(id, body)` → `PUT media/folders/{id}`, a **full replace**: a rename sends `{ name, parentFolderId: node.parentFolderId }`, and a move sends `{ name: node.name, parentFolderId }` (`null` = top level).

- **Rename** is inline in the row (see [`AssetFolderTreeItem`](/components/asset/AssetFolderTreeItem#rename)). An empty or unchanged name makes no call, and a `/` is refused in the input. There is no URL-change warning, matching asset rename in [`AssetDetailPanel`](/components/asset/AssetDetailPanel).
- **Move** opens [`AssetFolderMoveDialog`](/components/asset/AssetFolderMoveDialog), which emits the new `parentFolderId`. The dialog closes once the `PUT` succeeds.
- While the `PUT` runs, the row's `⋯` icon spins (`busyIds`). Each folder saves on its own, so a rename on one row isn't dropped while another row's `PUT` runs. A failure goes to the global error toast (`errorContext` is set on `folder.update`; a sibling with the same name is a `409`).

The folder rows change as soon as the `PUT` answers, so the tree refetches `asset-folders` + `asset-library-list` right away and renders from them, not from the response. A `202` with a `moveId` means the files of the assets inside are still being copied to the new path. That starts a `move` [background job](/composables/useBackgroundJobs) (`folderIds: [id]`, "Renaming folder {name}" with the "Renaming…" activity, or "Moving folder {name}"), which refetches both keys again and toasts `entity_updated` once the move lands. Without a `moveId` (nothing to copy) the tree toasts `entity_updated` at once.

While that job is pending, the folder and its subtree are **locked** (`movingFolderIds` → `descendantIds`, passed as `lockedIds`): **Rename** and **Move** are disabled in their menus, because their paths are moving too.

## Deleting a folder

1. The **Delete folder** menu item first inspects the folder: two `assetApi.query` counts over the subtree (`pageSize: 1` → `totalItemCount`), one for live assets and one with `trashed: true`, plus the subfolders from `descendantIds`. No dialog opens until they answer; meanwhile that row's `⋯` icon turns into a spinner (`busyIds` on `AssetFolderTreeItem`) and its hover actions stay visible.
2. Only a folder **proven empty** gets the plain [`DialogDelete`](/components/dialog/DialogDelete), which calls `assetApi.folder.delete(id)` — no `action` (toast `entity_deleted`). Anything else, or a failed count, opens [`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog) directly: move to trash, move assets to uncategorised, or delete permanently (its trash option is safe on an empty folder too). If the plain delete still answers `409 FOLDER_NOT_EMPTY` / `FOLDER_HOLDS_TRASHED_ASSETS` (e.g. a trashed empty subfolder the tree doesn't list), it swaps to the options dialog.
3. The choice calls `assetApi.deleteFolder(id, action)`. The toast title is `entity_moved_to_trash` (trash, relocate) or `entity_deleted` (purge), with the response's `assetCount` as the description (`folder_delete_{action}_done`). `trash` toasts at once. `relocate` (with a `moveId`) and `purge` (with assets) answer `202` and settle later, so they start a [background job](/composables/useBackgroundJobs) ("Deleting folder {name}": a `move` job on the `moveId`, or a `due-purge` job) and the same toast comes once it lands.

Both calls pass `suppressErrorToast: true`: a failure is shown inline in the dialog that made it (`folderDeleteFailure` → `folder_delete_move_pending`, `folder_delete_too_large`, `folder_delete_name_clash` for a relocate, else `error_try_again`), so the user can retry or pick another option.

After success the tree refetches [`useFolders`](/composables/useFolders), `asset-library-list` and `asset-tags` (the folders leave the tree at once), and clears the selection if it was inside the deleted subtree. A background job refetches them again once its assets land; until then they can still show in their old folder or in the trash — see [Assets → Folder delete](/domains/assets).

## Trashed folders

Folding out **Trash** lists the folders the merchant trashed, newest first: `useAsyncData('asset-trash-folders', () => assetApi.folder.listTrashed())` → `GET media/folders?trashed=true`. It isn't fetched in `readonly` mode. The list is flat: a subfolder that went to the trash with its parent is left out, because restoring the parent brings it back. Trash opens by itself when a trashed folder is selected (e.g. from a `?folder=trash:<id>` link).

- **Clicking a trashed folder** selects `trashedFolderKey(id)`. `assetListOptions` turns that into `{ trashed: true, folderId }`, so the page lists the folder's trashed contents, subfolders included. `isTrashSelection` treats it like Trash: restore and purge only, trash columns and sort, no upload.
- **Restore** (hover ↶, where a live row has "+ add"): `assetApi.folder.restore(id)` → `POST media/folders/{id}/restore`. It brings back what went to the trash with the folder, plus any trashed parents without their other contents, at the same URLs. It runs without a confirm (soft), toasts `entity_restored`, and if that folder was being viewed it selects the restored live folder. A failure is a negative toast with friendly copy (`folderRestoreFailure` → `folder_restore_*`). The rail has no room for an inline message, and the backend's `409` detail is a bare id, so the call passes `suppressErrorToast: true`. A `404` (already reaped) also refetches the list. The row's restore icon spins while it runs.
- **Delete permanently** (hover trash can): a red [`DialogDelete`](/components/dialog/DialogDelete) (`purge_folder_title`, `trashed_folder_purge_description` + `purge_note`, confirm `delete_permanently`). On confirm the tree loads the folder's trashed assets (`assetApi.matchingAssets`, `trashed: true`) and purges them through `assetApi.bulkPurge` in chunks of 100. That's the documented route for trashed items; the backend then deletes the emptied folder on its own, after a while. So the row is hidden for the rest of the session, and a view of it falls back to Trash. The purge lands about a minute later, so it starts a `purge` [background job](/composables/useBackgroundJobs) on the purged ids ("Deleting folder {name}"), which refreshes the folders, trashed folders, list and tags and toasts `entity_deleted` with the purged count once the assets are gone. If the folder holds no trashed assets there is nothing to purge, so the tree says so (`trashed_folder_empty_note`) and keeps the row: the backend removes an empty trashed folder on its own. Failures render in the dialog, and a failure after some chunks already went through refreshes the trash view.
- After either action the tree refreshes `asset-folders`, `asset-trash-folders`, `asset-library-list` and `asset-tags`. Folder delete, `useAssetActions().restoreAsset` and Empty trash refresh `asset-trash-folders` too.

## Data

Reads [`useFolders`](/composables/useFolders) — the nested `tree`, shared through the `asset-folders` cache with every other consumer — plus its own `asset-trash-folders` read (above).

### Loading

- **First load:** four skeleton rows, with an icon bar and a text bar lined up under a row's folder icon and name (`SidebarMenuSkeleton show-icon class="ps-8"`). Only until the first fetch lands, so an empty library never flashes skeletons later.
- **Refetch** (after a create, rename, move, delete or restore): the folders stay on screen with `aria-busy` and dim once the refetch runs past 200 ms ([`useRefetchDim`](/composables/useRefetchDim)).
- **Create:** the inline new-folder row keeps the committed name, locked with a spinner, until the refetch lands, so the new folder replaces it instead of popping in. The tree tracks the parents with a create in flight (`creatingIds`); the top-level row stays via **New folder**'s own state.

## Related

- [`AssetFolderTreeItem`](/components/asset/AssetFolderTreeItem) — the recursive row rendered per folder (internal), and its inline name input.
- [`AssetFolderMoveDialog`](/components/asset/AssetFolderMoveDialog) — the move destination picker.
- [`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog) — the options for deleting a folder that isn't empty.
