# `AssetWizardReview`

`AssetWizardReview` is **step 3 (review)** of the upload wizard — a read-only summary of every selected file with its resolved metadata (folder, tags, channels), before the upload runs. Reads the shared wizard state via [`useUploadWizard`](/composables/useUploadWizard) (`useUploadWizardContext`); the upload itself is triggered from the wizard page.

## Usage

```vue
<AssetWizardReview />
```

No props — it renders from the shared wizard files + settings.

## Behaviour

- A "{n} files total" count and a **group-by-folder** toggle (flat list vs. grouped, with "no folder" last).
- Each row shows the type-tinted icon, the (possibly renamed) file name, its folder / tags / channels, size, an [`AssetTypeBadge`](/components/asset/AssetTypeBadge), and a per-row remove (drops the file from the upload via `removeFiles`).
- Channel ids are resolved to names via the account store.

## Dependencies

- [`useUploadWizard`](/composables/useUploadWizard), [`useFolders`](/composables/useFolders), `useAssetType`
- [`AssetTypeBadge`](/components/asset/AssetTypeBadge); `formatFileSize` (`#shared/utils/file`)
