# `AssetFolderMoveDialog`

`AssetFolderMoveDialog` picks a new parent for a folder. [`AssetFolderTree`](/components/asset/AssetFolderTree) opens it from a row's **Move folder** menu item. It wraps the [`AssetBulkMoveFolder`](/components/asset/AssetBulkMoveFolder) pane in a dialog: a warning that the URLs of the assets in the folder change, then the folder tree as a destination picker.

## Features

- **Not pickable:** the folder itself and its descendants (a folder can't go inside its own subtree), and its current parent (a no-op). That's the parent folder, or **Uncategorised** (`ROOT_FOLDER_KEY`) for a top-level folder. They render disabled through the tree's `disabledIds`.
- **Uncategorised** is the library root: picking it sends `parentFolderId: null` (`folderIdForSelection`), so the folder becomes top level.
- The destination resets each time the dialog opens, and **Move folder** stays disabled until a pickable folder is selected.
- The dialog only emits. The tree sends the `PUT` and closes the dialog once it succeeds. On a failure (the global error toast reports it, e.g. a `409` for a sibling with the same name) the dialog stays open, so another destination can be picked.

## Usage

```vue
<AssetFolderMoveDialog
  v-model:open="moveOpen"
  :folder="moveTarget"
  :loading="!!moveTarget && updatingIds.includes(moveTarget._id)"
  @confirm="confirmMove"
/>
```

## Props

| Prop      | Type                 | Notes                                    |
| --------- | -------------------- | ---------------------------------------- |
| `folder`  | `FolderNode \| null` | The folder being moved                   |
| `loading` | `boolean`            | The `PUT` is running; spinner on confirm |

## Models

| Model          | Type      | Notes             |
| -------------- | --------- | ----------------- |
| `v-model:open` | `boolean` | Dialog visibility |

## Events

| Event     | Payload                          | When                                        |
| --------- | -------------------------------- | ------------------------------------------- |
| `confirm` | `parentFolderId: string \| null` | **Move folder** clicked; `null` = top level |

## Dependencies

- [`AssetBulkMoveFolder`](/components/asset/AssetBulkMoveFolder) (with `folder` + `disabledIds`)
- [`useFolders`](/composables/useFolders) for `descendantIds`
- shadcn-vue `Dialog`
