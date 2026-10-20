# `AssetDropzone`

`AssetDropzone` is the drag-and-drop / click-to-browse file picker shared by the asset upload surfaces (the quick-upload [`AssetUploadDialog`](/components/asset/AssetUploadDialog) and the multi-step upload wizard at `/asset-library/upload`).

It is **purely a picker** — it holds no file state. It emits the chosen files and the consumer owns the list. This keeps a single dropzone look-and-feel across every upload entry point.

## Usage

```vue
<AssetDropzone @add="addFiles" />
```

```ts
function addFiles(list: File[]) {
  files.value = [...files.value, ...list];
}
```

## Props

### `size`

```ts
size?: 'md' | 'lg' // default 'md'
```

`lg` gives a taller drop target (upload wizard); `md` is the compact dialog.

### `multiple`

```ts
multiple?: boolean // default true
```

Allow picking several files at once. `false` constrains it to a single file (only the first picked/dropped file is emitted, the native input drops its `multiple` attribute, and the label switches to the singular `asset_library.drop_file_here`). The asset picker uses this to mirror a single-select picker as a single-file quick upload.

## Events

### `add`

```ts
add: [File[]];
```

Emitted with the picked files on drop or after choosing files in the native dialog. Fires for one or more files; never fires with an empty list. The native `<input>` is reset after each pick, so re-selecting the same file emits again.

## Notes

- The main + hint labels come from the `asset_library.drop_files_here` / `asset_library.drop_file_here` (single mode) and `asset_library.upload_accepted_types` i18n keys.
- File rows are rendered by the consumer, typically with [`AssetFileRow`](/components/asset/AssetFileRow).
