# `AssetFolderTreeItem`

`AssetFolderTreeItem` is the recursive row that [`AssetFolderTree`](/components/asset/AssetFolderTree) renders per folder. It renders a shadcn `SidebarMenuItem` with the row button, an expand chevron when the folder has children, and the hover actions. Its children render as nested `AssetFolderTreeItem`s with the same props. The tree owns all state and API calls; the row only emits.

:::tip NOTE
Internal to `AssetFolderTree`. Use the tree, not the row.
:::

## Row actions

The actions sit to the right of the row as siblings of the row button, so the button never holds a nested interactive element. They show on hover and on keyboard focus. They stay visible while the row is busy or its menu is open.

- **Live row**: two icons.
  - `+` **add subfolder**: opens an inline name input under the row and emits `create`.
  - `⋯` opens a `DropdownMenu` with **Rename folder**, **Move folder** and **Delete folder**, all in regular styling. Red is kept for the hard-delete confirm in the dialog that delete opens.
- **Trashed row** (`trashed`): **Restore** (↶) and **Delete permanently** (trash can). No `⋯` menu, so no rename or move: a trashed folder is restored first.
- **Readonly row** (`readonly`, the picker): no actions.

While `busyIds` holds this row's folder (the tree is counting it for a delete, or saving a rename or move), the `⋯` trigger turns into a spinner and is disabled. While a background job holds the folder (`lockedIds`), **Rename** and **Move** are disabled in the menu. **Delete** stays available, because the backend answers that with its own friendly `MOVE_PENDING` copy.

### Rename

**Rename folder** swaps the row button for [`AssetFolderCreateInput`](#inline-name-input) prefilled with the name and selected. The chevron and the actions hide while it's open. Enter or blur commits, and Esc cancels. An unchanged or empty name commits nothing. The row emits `rename` with the new name; the tree sends the `PUT`.

The rename starts in the menu's `close-auto-focus` handler, which also prevents the default. On close the menu moves focus back to its `⋯` trigger, and that would blur, and so commit, an input mounted any earlier.

## Inline name input

`AssetFolderCreateInput` is the name input for both a new folder and a rename. It renders the input only, so a caller wraps it in a `SidebarMenuItem` for a new row (the tree's **New folder**, a row's add subfolder) or renders it inside an existing row (rename).

| Prop           | Type     | Notes                                                                |
| -------------- | -------- | -------------------------------------------------------------------- |
| `initialValue` | `string` | Prefills and selects the input (a rename). Unchanged commits cancel. |

It emits `create` with the trimmed name, or `cancel`, exactly once (a guard stops the unmount blur committing twice). A name with a `/` marks the input invalid and shows `asset_library.asset_name_no_slash` under it: Enter keeps editing, and blur cancels.

## Props

| Prop          | Type             | Notes                                                                              |
| ------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `node`        | `FolderNode`     | The folder, with `children`                                                        |
| `selected`    | `string \| null` | The tree's selection; the row is active when it matches                            |
| `readonly`    | `boolean`        | Picker mode: no actions                                                            |
| `busyIds`     | `string[]`       | Folders whose delete or update is being prepared; their `⋯` (or trash) icon spins  |
| `trashed`     | `boolean`        | A folder under Trash: selects `trashedFolderKey(id)`, restore + delete permanently |
| `restoringId` | `string \| null` | Folder being restored; its restore icon spins                                      |
| `disabledIds` | `string[]`       | Folders that can't be selected: the row button is disabled (a move's own subtree)  |
| `lockedIds`   | `string[]`       | Folders a pending rename/move holds; **Rename** and **Move** are disabled          |

## Events

| Event     | Payload                                    | When                                     |
| --------- | ------------------------------------------ | ---------------------------------------- |
| `select`  | `id: string`                               | Row clicked (folder id or trashed key)   |
| `create`  | `{ parentFolderId: string; name: string }` | Add subfolder committed                  |
| `rename`  | `{ node: FolderNode; name: string }`       | Inline rename committed with a new name  |
| `move`    | `node: FolderNode`                         | **Move folder** chosen in the `⋯` menu   |
| `delete`  | `node: FolderNode`                         | **Delete folder**, or delete permanently |
| `restore` | `node: FolderNode`                         | Restore on a trashed row                 |

## Dependencies

- shadcn-vue `SidebarMenuItem` / `SidebarMenuButton` / `SidebarMenu`, `DropdownMenu`
- `AssetFolderCreateInput`
