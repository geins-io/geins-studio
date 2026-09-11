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

### `methods`

```ts
methods?: readonly ('quick' | 'wizard' | 'csv')[] // default all three
```

Which upload methods to offer in step 1. When only **one** method remains the chooser is skipped and the dialog opens straight into that flow — the asset picker embeds it as `:methods="['quick']"` so the wizard (which routes away to `/asset-library/upload`) can never abandon the picker/entity context. In quick-only mode the step-2 back button reads **Cancel** and closes.

### `multiple`

```ts
multiple?: boolean // default true
```

Allow selecting several files in quick upload. `false` constrains it to a single file (forwarded to [`AssetDropzone`](/components/asset/AssetDropzone)); a single-select asset picker uses this.

## Emits

### `uploaded`

```ts
uploaded: [assets: Asset[]];
```

Fires with the created assets after a successful quick upload (alongside the toast + library refresh). Embedders like the asset picker listen to auto-select the new assets.

## v-model

### `open`

```ts
v-model:open: boolean
```

Dialog visibility. Selected files + folder reset each time it opens.

## Behaviour

- **Files** — drag/drop onto the zone or click to browse (multiple by default; single when `multiple` is `false`); each file lists its name + size with a remove button.
- **Folder** — a `Select` of all folders (or "No folder — uncategorised"), plus **New folder** which reveals an inline name input and creates via `assetApi.folder.create` (then selects it).
- **Upload** — builds a `FormData` (`files` + optional `folderId`) and calls [`assetApi.upload`](/domains/assets); refreshes `asset-library-list` and toasts the count.

## Dependencies

- [`useFolders`](/composables/useFolders) — folder list + refresh
- `assetApi.upload` / `assetApi.folder.create`, `formatFileSize` (`#shared/utils/file`)
- shadcn-vue `Dialog`, `Select`, `Input`, `Button`, `Label`
