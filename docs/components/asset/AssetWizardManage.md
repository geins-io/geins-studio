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

**Capability gating.** `name` + folder + description + alt text all persist via the ticket claim itself (applied when the upload completes, no follow-up write) — all editable. **Tags + channels** have no phase-1 upload route, so under a non-mock backend they render in a disabled `<fieldset>` with a "not saved yet" hint (`useAssetCapabilities` → `canEditTags` / `canEditChannels`); values are still held in wizard state. Tag autocomplete only fetches when `tagAutocomplete` is on. The bulk pane ([`AssetWizardBulkPane`](/components/asset/AssetWizardBulkPane)) gates the same two fields. (`cutover: REVISIT@phase2`.)

**Unsaved folder name.** The wizard page's **Next** button awaits [`usePendingCommits`](/composables/usePendingCommits) before advancing, so a folder name typed into the picker here (or in the bulk pane) is created instead of dropped when this step unmounts.

## Dependencies

- [`useUploadWizard`](/composables/useUploadWizard) — shared files + per-file settings
- [`useFolders`](/composables/useFolders), `useAssetType`, `assetApi.listTags`, [`useAssetCapabilities`](/composables/useAssetCapabilities)
- `FormInputChannels`, `FormInputTagsSearch`, `FormTranslatableField`, [`AssetFolderPicker`](/components/asset/AssetFolderPicker)
