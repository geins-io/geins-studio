# `AssetWizardBulkPane`

`AssetWizardBulkPane` is the bulk-edit side of **step 2** of the upload wizard, rendered by [`AssetWizardManage`](/components/asset/AssetWizardManage) whenever more than one file is checked. It applies folder, channels, content languages and tags across the whole selection in one pass.

The reconciliation logic lives in [`useUploadWizard`](/composables/useUploadWizard) (not the template): a shared value when every file agrees vs. "mixed", tri-state channels, and shared-tag diffing.

## Usage

```vue
<AssetWizardBulkPane
  :ids="checked"
  :tag-options="tagOptions"
  @deselect="checked = []"
  @removed="checked = []"
/>
```

## Props

- **`ids: string[]`** — the checked file ids the bulk actions apply to.
- **`tagOptions: EntityBaseWithName[]`** — existing-tag autocomplete options (from `assetApi.listTags()`), owned by the parent so both panes share one fetch.

## Events

- **`deselect`** — the "deselect all" affordance was clicked; the parent clears the selection.
- **`removed`** — the checked files were removed from the upload; the parent clears the selection.

## Fields

- **Folder** — [`AssetFolderPicker`](/components/asset/AssetFolderPicker) bound to `bulkFolderId`/`setBulkFolder`. Shows the "multiple folders — keep as is" placeholder when the selection spans different folders (the picker renders nothing selected for an `undefined` model).
- **Channels** — the normal channel selector (`FormInputChannels`) showing the union of channels across the selection. A channel only some files have is marked with a **dashed chip border** (`channelState`); adding a channel puts it on every file, removing one takes it off every file (`bulkChannelUnion`/`applyBulkChannels`).
- **Content languages** — [`FormInputLanguages`](/components/form/input/FormInputLanguages) bound to `bulkLanguages`/`setBulkLanguages`. Shows the set when every checked file holds the same one; a mixed selection shows an empty field and the hint "The selected files have different content languages. Picking here replaces them on all." A pick **replaces** the set on every file (nothing is diffed, unlike channels and tags).
- **Tags** — `FormInputTagsSearch` bound to `bulkSharedTags`/`applyBulkTags`; chips show only the tags shared by every checked file. Adding a tag appends it to all; removing one strips it from all, leaving each file's non-shared tags intact.
- **Remove from upload** — drops the checked files from the upload (not a delete).

**Label limits.** Channels, content languages and tags each show an inline error when any checked file breaks a backend limit — checked per file (`labelLimitError(ids, kind)`), so a too-long tag that only some files hold still shows even though the chips list just the shared ones. Wording comes from [`useAssetLabelLimits`](/composables/useAssetLabelLimits), matching [`AssetWizardManage`](/components/asset/AssetWizardManage).
