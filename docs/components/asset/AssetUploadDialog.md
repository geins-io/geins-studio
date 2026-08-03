# `AssetUploadDialog`

`AssetUploadDialog` is the upload dialog. Step 1 picks an upload method — only **Quick upload** is available in v0; **Upload wizard** and **CSV import** are shown disabled with a "coming soon" tooltip. Step 2 is quick upload: drag-and-drop or browse for files, pick a target folder (with inline folder create), and upload. On success it refreshes the library list and closes.

## Usage

Controlled via `v-model:open`; opened from the library page's "Upload assets" button.

```vue
<AssetUploadDialog
  v-model:open="uploadOpen"
  :default-folder-id="selectedFolder"
/>
```

## Props

### `defaultFolderId`

```ts
defaultFolderId?: string | null
```

Pre-selected target folder (e.g. the folder currently filtered in the library). Defaults to none (uncategorised).

## v-model

### `open`

```ts
v-model:open: boolean
```

Dialog visibility. Selected files + folder reset each time it opens.

## Behaviour

- **Files** — drag/drop onto the zone or click to browse (multiple); each file lists its name + size with a remove button.
- **Folder** — a `Select` of all folders (or "No folder — uncategorised"), plus **New folder** which reveals an inline name input and creates via `assetApi.folder.create` (then selects it).
- **Upload** — builds a `FormData` (`files` + optional `folderId`) and calls [`assetApi.upload`](/domains/assets); refreshes `asset-library-list` and toasts the count.

## Dependencies

- [`useFolders`](/composables/useFolders) — folder list + refresh
- `assetApi.upload` / `assetApi.folder.create`, `formatFileSize` (`#shared/utils/file`)
- shadcn-vue `Dialog`, `Select`, `Input`, `Button`, `Label`
