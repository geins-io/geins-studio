# `AssetFolderDeleteDialog`

`AssetFolderDeleteDialog` offers what happens when a folder that **isn't empty** is deleted. Each option takes the folder and its whole subtree, and maps to an `?action=` of `DELETE media/folders/{id}`:

| Option                           | `action`   | What it does                                                                                                      | Confirm button |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| **Move to trash** (default)      | `trash`    | The folder and everything in it go to the trash, restorable for 30 days. URLs keep working until purge.           | `default`      |
| **Move assets to uncategorised** | `relocate` | The live assets move to the library root, the folder goes to the trash. Shown only when there are assets to move. | `default`      |
| **Delete permanently**           | `purge`    | The folder and all its assets are deleted, including any already in the trash. Can't be undone.                   | `destructive`  |

The wording follows the soft/hard split in [Delete vocabulary](/domains/assets#delete-vocabulary): the option cards are never red, and only the permanent delete's confirm is. The confirm button repeats the selected option's title.

Every option shows a warning callout so the choice says what running it does: relocate warns that the moved files' links change (`bulk_move_url_*`), trash and purge that the assets come off everything that uses them (`removing_everywhere`). A failure replaces the callout with an error one.

[`AssetFolderTree`](/components/asset/AssetFolderTree#deleting-a-folder) opens it directly for any folder it can't prove empty (subfolders, live or trashed assets, or a failed count); a proven-empty folder gets the plain `DialogDelete` instead.

## Usage

```vue
<AssetFolderDeleteDialog
  v-model:open="choiceOpen"
  v-model:error="choiceError"
  :folder-name="target?.name ?? ''"
  :count="liveCount"
  :loading="deleting"
  @confirm="(action) => assetApi.deleteFolder(target._id, action)"
  @cancel="choiceOpen = false"
/>
```

## Props

### `folderName`

```ts
folderName: string;
```

Name of the folder being deleted — shown in the dialog title.

### `count`

```ts
count: number | null;
```

Live assets in the folder **and its subtree**. A positive count names them in the intro ("This folder contains 3 assets"); `0` (only subfolders or trashed assets left) or `null` (the count failed) falls back to a count-free intro. `0` also hides the relocate option, which would have nothing to move.

### `loading`

```ts
loading?: boolean;
```

Shows a spinner on the confirm button while the delete request is in flight.

## v-model

### `open`

```ts
v-model:open: boolean;
```

Controls visibility. **Default:** `false`. Opening resets the choice to **Move to trash**.

### `error`

```ts
v-model:error: string | undefined;
```

Why the last attempt failed, already translated — rendered as a negative callout. The dialog clears it when the user picks another option.

## Events

### `confirm`

```ts
confirm: [action: 'trash' | 'relocate' | 'purge'];
```

Emitted with the chosen action. The handler owns the repository call, refresh, toast and closing.

### `cancel`

Emitted when the user clicks Cancel.

## Dependencies

- shadcn-vue `Dialog`, `Button`; app `Feedback`
- [`useLucideIcon`](/composables/useLucideIcon) — resolves the option icons
- Wired by [`AssetFolderTree`](/components/asset/AssetFolderTree) to `assetApi.deleteFolder`
