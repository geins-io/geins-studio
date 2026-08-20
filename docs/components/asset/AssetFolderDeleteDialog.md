# `AssetFolderDeleteDialog`

`AssetFolderDeleteDialog` is the folder-delete confirmation shown when a folder (or its subtree) **still contains assets**. It asks the user what should happen to those files:

- **Move to uncategorised** — keep the files, re-home them to the uncategorised bucket (the server sets `folder_id` to `null`).
- **Delete folder and files** — permanently delete the files too.

Empty folders never reach this dialog — [`AssetFolderTree`](/components/asset/AssetFolderTree) shows the plain [`DialogDelete`](/components/dialog/DialogDelete) confirm instead. The subtree asset count is resolved by the caller (via `assetApi.list({ folderId })`, which already returns the folder + descendants) and passed in.

A destructive-usage warning ("if a file is used in several places, it will be removed from all of them") is shown only when the delete option is selected.

## Usage

```vue
<AssetFolderDeleteDialog
  v-model:open="choiceOpen"
  :folder-name="target?.name ?? ''"
  :count="pendingCount"
  :loading="deleting"
  @confirm="(assets) => deleteFolder(target._id, assets)"
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
count: number;
```

Number of assets in the folder **and its subtree**. Drives the intro copy and its pluralization. The dialog assumes `count > 0` (empty folders use `DialogDelete`).

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

Controls visibility. **Default:** `false`.

## Events

### `confirm`

```ts
confirm: [assets: 'move' | 'delete'];
```

Emitted with the chosen disposition (defaults to the safe `'move'`). The handler owns the repository call, refresh, and closing.

### `cancel`

Emitted when the user clicks Cancel.

## Dependencies

- shadcn-vue `Dialog`, `Button`, `Alert`
- [`useLucideIcon`](/composables/useLucideIcon) — resolves the option icons
- Wired by [`AssetFolderTree`](/components/asset/AssetFolderTree) to `assetApi.deleteFolder`
