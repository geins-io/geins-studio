# `useFolders`

The `useFolders` composable is the single shared source of Assets Library folders. It fetches the folder list once (by the stable `asset-folders` key, so every consumer shares the same data) and derives the nested tree and name-by-id lookup.

:::tip NOTE
Folder **filtering** is server-side — the library page sends `folderId` to `assetApi.list` and the backend resolves descendants. `descendantIds` here is only a client mirror for UI needs.

"Uncategorised" is **not** a folder row: it is the library-root query (`folderId: null`), built from `assetListOptions` / `ROOT_FOLDER_KEY` in `#shared/utils/asset`. See [`AssetFolderTree`](/components/asset/AssetFolderTree).
:::

## Usage

```ts
const { tree, folderName, loading, refresh } = useFolders();

// resolve a name for a card / row
const name = folderName(asset.folderId);

// after a folder mutation
await assetApi.folder.create({ name: 'Campaigns', parentFolderId: null });
await refresh();
```

## Returns

### `folders`

```ts
folders: ComputedRef<Folder[]>;
```

All folders (flat), normalized to an array. The Supabase mock's locked `system` rows (`Uncategorised`, `Archived`) are filtered out — real Geins.Media has no system folders, and the filter drops with the mock.

### `tree`

```ts
tree: ComputedRef<FolderNode[]>;
```

The folders nested via `parentFolderId`, sorted by `sortOrder` then name at each level. `FolderNode` is a `Folder` plus a `children: FolderNode[]` array.

### `folderName`

```ts
folderName(id?: string | null): string | undefined
```

Looks up a folder's name by id (for cards and list rows).

### `descendantIds`

```ts
descendantIds(rootId: string): string[]
```

A folder plus all its descendants — a client mirror of the server filter, for UI needs only.

### `loading` / `error` / `refresh`

Standard `useAsyncData` state; call `refresh()` after any folder mutation to update every consumer.

## Type Definitions

```ts
interface FolderNode extends Folder {
  children: FolderNode[];
}

function useFolders(): UseFoldersReturnType;
```
