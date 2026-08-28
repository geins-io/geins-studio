# `AssetFolderPicker`

`AssetFolderPicker` is the folder selector with inline "create new" — the shared control used wherever an asset's folder is chosen: the quick-upload [`AssetUploadDialog`](/components/asset/AssetUploadDialog), the [`AssetDetailPanel`](/components/asset/AssetDetailPanel), and the upload wizard's manage step.

It reads the folder list from [`useFolders`](/composables/useFolders). The **new** button swaps the select for a name input that creates the folder via `assetApi.folder.create`, then selects the freshly created folder.

## Usage

```vue
<!-- plain v-model (folder id or null) -->
<AssetFolderPicker v-model="folderId" />

<!-- inside a vee-validate FormField -->
<FormField v-slot="{ value, handleChange }" name="folderId" keep-value>
  <FormItem>
    <FormLabel :optional="true">{{ $t('folder', 1) }}</FormLabel>
    <AssetFolderPicker
      :model-value="value"
      @update:model-value="handleChange"
    />
  </FormItem>
</FormField>
```

## Model

`v-model` — the selected folder id (`string`), or `null` for uncategorised. A `__none__` sentinel is used internally because the underlying `Select` needs a string value; the component maps it to `null` for you.

## Props

### `placeholder`

```ts
placeholder?: string;
```

Select placeholder shown when nothing is chosen. Defaults to the "no folder — uncategorised" label. Useful for the bulk case where the selection spans multiple folders (e.g. "multiple folders — keep as is").

## Dependencies

- [`useFolders`](/composables/useFolders) — folder list + refresh
- `assetApi.folder.create` — inline folder creation
