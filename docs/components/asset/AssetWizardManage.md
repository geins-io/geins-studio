# `AssetWizardManage`

`AssetWizardManage` is **step 2 (manage)** of the asset upload wizard (`/asset-library/upload`). A split panel: the left column lists the selected files with checkboxes; the right column edits the metadata of the single selected file, or shows the bulk pane when several are checked.

All edits write straight into the shared wizard state via [`useUploadWizard`](/composables/useUploadWizard) (`useUploadWizardContext`), so no props are needed — it reads the same files + settings the other steps use.

## Usage

```vue
<!-- inside the wizard page, filling the app-shell middle -->
<AssetWizardManage v-if="currentStep === 2" class="min-h-0 flex-1" />
```

## Selection model

- **Row click** selects exactly one file → its fields show on the right.
- **Row checkbox** adds/removes a file from the multi-selection.
- The **header checkbox** selects all (indeterminate when only some are checked).
- One checked file → single-file fields; more than one → the bulk pane (STU-320); none → an empty state.

## Fields (single file)

`name`, folder ([`AssetFolderPicker`](/components/asset/AssetFolderPicker)), alt text for images ([`FormTranslatableField`](/components/form/FormTranslatableField)), channels (`FormInputChannels`), description, and tags (`FormInputTagsSearch`, autocompleted from `assetApi.listTags()`). Each binds to the active file's `WizardFileSettings` through `patchSettings`.

## Dependencies

- [`useUploadWizard`](/composables/useUploadWizard) — shared files + per-file settings
- [`useFolders`](/composables/useFolders), `useAssetType`, `assetApi.listTags`
- `FormInputChannels`, `FormInputTagsSearch`, `FormTranslatableField`, [`AssetFolderPicker`](/components/asset/AssetFolderPicker)
