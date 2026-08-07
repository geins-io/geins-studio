# `AssetFileRow`

`AssetFileRow` is the selected-file row shared by the asset upload / replace dialogs: a type-tinted icon (resolved from the file's mime via [`useAssetType`](/composables/useAssetType)), the file name, its size, and a remove button.

It operates on a native `File` (pre-upload), so it takes the file directly rather than an `Asset`.

## Usage

```vue
<!-- AssetUploadDialog: many files -->
<AssetFileRow
  v-for="(file, index) in files"
  :key="index"
  :file="file"
  @remove="removeFile(index)"
/>

<!-- AssetReplaceDialog: a single file -->
<AssetFileRow v-if="file" :file="file" @remove="file = null" />
```

## Props

### `file`

```ts
file: File;
```

The picked file. Its `type` drives the icon + tint; `name` and `size` are shown.

## Events

### `remove`

Emitted when the remove (✕) button is clicked. The parent owns the list, so it decides what removing means.

## Dependencies

- [`useAssetType`](/composables/useAssetType) — icon + tint per `AssetType`; `mimeToAssetType` (`#shared/utils/asset`)
- `useLucideIcon` — resolves the icon name; `formatFileSize` (`#shared/utils/file`)
