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

## Unsaved inline names

A name typed into the inline input but never saved is registered with the nearest [`usePendingCommits`](/composables/usePendingCommits) host, so the host's primary action (Upload, Save, Next) creates the folder and selects it **before** it runs. Without that the folder was never created and the action quietly used no folder at all.

If the create fails the input stays open with the name intact — the global error toast says why — and the host's action is aborted rather than run against the wrong folder.

## Dependencies

- [`useFolders`](/composables/useFolders) — folder list + refresh
- [`usePendingCommits`](/composables/usePendingCommits) — commits an unsaved name on the host's primary action
- `assetApi.folder.create` — inline folder creation
