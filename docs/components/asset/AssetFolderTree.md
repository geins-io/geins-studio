# `AssetFolderTree`

`AssetFolderTree` is the folder-navigation tree for the Assets Library, built on the shadcn `Sidebar` primitives. It shows **All assets** on top, the nested user folders (each expandable), and the locked system folders (`Uncategorised`, `Archived`) pinned to the bottom.

Selection is emitted via `v-model:selected` — the folder id, or `null` for **All assets**. The library page turns that into the server-side `folderId` filter (`assetApi.list`); the tree itself only selects.

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

The selected folder id, or `null` for "All assets".

## Data

Reads [`useFolders`](/composables/useFolders) — the `tree` (nested user folders) and `systemFolders`. No fetching of its own; it shares the `asset-folders` cache with every other consumer.

## Related

- `AssetFolderTreeItem` — the recursive row rendered per folder (internal).
- CRUD (create / rename / move / delete) layers on top in a separate change.
