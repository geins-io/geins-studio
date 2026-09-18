# `AssetFolderTree`

`AssetFolderTree` is the folder-navigation tree for the Assets Library, built on the shadcn `Sidebar` primitives. Under a "Folders" header it shows **All assets**, then the nested folders (each expandable via a leading chevron; the folder icon opens when expanded/active), with the pinned **Uncategorised** view last — below the folder list, where the mock's system folders used to sit.

Selection is emitted via `v-model:selected` — a folder id, `null` for **All assets**, or `ROOT_FOLDER_KEY` (`'root'`, from `#shared/utils/asset`) for **Uncategorised**. The consumer turns that into list options with `assetListOptions(selected)`; the tree itself only selects.

:::tip NOTE
**Uncategorised is a query, not a folder.** Real Geins.Media has no system folders — assets with no folder are `folderId: null`, and the query asks for them with `folderIds: [null]`. That is why the entry is pinned by the component rather than coming from the folder list, and why `assetListOptions` distinguishes "root only" (`folderId: null`) from "all assets" (no folder scope at all).
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

The selected folder id, `null` for "All assets", or `ROOT_FOLDER_KEY` for "Uncategorised" (assets with no folder). It is also the `?folder=` URL value on the library page, so every view deep-links.

## Props

### `readonly`

```ts
readonly?: boolean // default: false
```

Selection-only mode. When `true`, every folder **mutation** control is gated off: the per-node hover **create subfolder** / **delete** actions, the top-level **New folder** input/button, and the delete dialogs. Selection + navigation still work.

The [`AssetPickerPanel`](/components/asset/AssetPickerPanel) passes `readonly` so a user browsing to pick an asset can't accidentally create or delete folders — folder management stays on the asset library page, which renders the tree with actions on (the default).

## Deleting a folder

Which delete flow runs is gated on `useAssetCapabilities().canDeleteFolderWithAssets`:

| Capability               | Flow                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **on** (`mock`)          | The tree counts the subtree (`assetApi.list({ folderId })`). Non-empty → [`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog) (move vs delete the assets), calling `assetApi.deleteFolder(id, assets)`. Empty → the plain [`DialogDelete`](/components/dialog/DialogDelete).                                                                                            |
| **off** (`media-phase1`) | **Empty-only delete.** No subtree probe and no disposition: the plain `DialogDelete` calls `assetApi.folder.delete(id)`. The backend answers `409 FOLDER_NOT_EMPTY` when the folder still holds assets — the call passes `suppressErrorToast: true` and the reason is rendered as the dialog's own warning callout, so the user can empty the folder and retry without losing the dialog. |

## Data

Reads [`useFolders`](/composables/useFolders) — the nested `tree`. No fetching of its own; it shares the `asset-folders` cache with every other consumer.

## Related

- `AssetFolderTreeItem` — the recursive row rendered per folder (internal).
- CRUD (create / rename / move / delete) layers on top in a separate change.
