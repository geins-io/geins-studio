# `AssetFolderTree`

`AssetFolderTree` is the folder-navigation tree for the Assets Library, built on the shadcn `Sidebar` primitives. Under a "Folders" header it shows **All assets**, then the nested user folders (each expandable via a leading chevron; the folder icon opens when expanded/active), followed inline by the locked system folders (`Uncategorised`, `Archived`).

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

## Props

### `readonly`

```ts
readonly?: boolean // default: false
```

Selection-only mode. When `true`, every folder **mutation** control is gated off: the per-node hover **create subfolder** / **delete** actions, the top-level **New folder** input/button, and the delete dialogs. Selection + navigation still work.

The [`AssetPickerPanel`](/components/asset/AssetPickerPanel) passes `readonly` so a user browsing to pick an asset can't accidentally create or delete folders — folder management stays on the asset library page, which renders the tree with actions on (the default).

## Data

Reads [`useFolders`](/composables/useFolders) — the `tree` (nested user folders) and `systemFolders`. No fetching of its own; it shares the `asset-folders` cache with every other consumer.

## Related

- `AssetFolderTreeItem` — the recursive row rendered per folder (internal).
- CRUD (create / rename / move / delete) layers on top in a separate change.
