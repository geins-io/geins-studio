# `AssetUploadDialog`

`AssetUploadDialog` is the upload dialog. Step 1 picks an upload method — **Quick upload** and **Upload wizard** (routes to `/asset-library/upload`); **CSV import** is shown disabled with a "coming soon" tooltip. Step 2 is quick upload: drag-and-drop or browse for files, pick a target folder (with inline folder create), and upload via the 3-step ticket flow. When every file lands it refreshes the library and closes; on a partial failure it toasts a summary and closes; when **nothing** lands it stays open and lists the per-file reasons.

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

Fires with the created assets after upload (the completed subset on a partial success), alongside the toast + library refresh. Embedders like the asset picker listen to auto-select the new assets.

## v-model

### `open`

```ts
v-model:open: boolean
```

Dialog visibility. Selected files + folder reset each time it opens.

## Behaviour

- **Files** — drag/drop onto the zone or click to browse (multiple by default; single when `multiple` is `false`); each file lists its name + size with a remove button.
- **Folder** — a `Select` of all folders (or "No folder — uncategorised"), plus **New folder** which reveals an inline name input and creates via `assetApi.folder.create` (then selects it).
- **Upload** — calls [`assetApi.uploadViaTickets`](/domains/assets) with `{ file, folderId }` per file (no metadata); refreshes `asset-library-list`. Completed files emit via `uploaded` and toast a count (or "X of Y" on a partial); rejections map to friendly copy via `uploadRejectionMessageKey` and show inline only when nothing landed.

## Dependencies

- [`useFolders`](/composables/useFolders) — folder list + refresh
- `assetApi.uploadViaTickets` / `assetApi.folder.create`, `uploadRejectionMessageKey` (`#shared/utils/asset`)
- shadcn-vue `Dialog`, `Select`, `Input`, `Button`, `Label`
