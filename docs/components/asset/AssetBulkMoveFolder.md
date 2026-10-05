# `AssetBulkMoveFolder`

`AssetBulkMoveFolder` is the properties pane of the library's bulk **Move to folder** action in [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet). It warns that each moved asset's URL changes, then shows [`AssetFolderTree`](/components/asset/AssetFolderTree) as a destination picker.

## Features

- A warning `Feedback`: moving changes every moved asset's public URL, so links pasted elsewhere stop working.
- The folder tree in `readonly` + `hideAll` mode: real folders and **Uncategorised** only. No "All assets", no Trash, no folder create/delete.
- The model is the raw tree selection. The page maps it to the API: `ROOT_FOLDER_KEY` → `folderId: null` (`folderIdForSelection`).

## Usage

```ts
const moveAction = computed<BulkAction<string | null>>(() => ({
  key: 'move-to-folder',
  label: t('asset_library.move_to_folder'),
  icon: 'FolderInput',
  component: AssetBulkMoveFolder,
  initialValue: () => null,
  isValid: (value) => !!value && value !== TRASH_KEY,
  run: (ids, value, options) =>
    assetApi.bulkMove(ids, folderIdForSelection(value), options),
  // …
}));
```

## Models

| Model     | Type             | Notes                                                        |
| --------- | ---------------- | ------------------------------------------------------------ |
| `v-model` | `string \| null` | Folder id or `ROOT_FOLDER_KEY`. `null` = nothing picked yet. |

## Dependencies

- [`AssetFolderTree`](/components/asset/AssetFolderTree), `Feedback`
- shadcn-vue `SidebarProvider` / `Sidebar` (the tree must sit inside them)
