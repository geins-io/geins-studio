# `AssetWizardProductLinking`

The whole-upload product-linking control shown above the [manage step](/components/asset/AssetWizardManage.md) file list: a checkbox to auto-link images to products, with a hint that it matches by article number or product ID in the filename.

Writes straight into the shared wizard state via [`useUploadWizard`](/composables/useUploadWizard.md) (`linkProducts`); the match itself — a filename ref against a product's **article number or product ID** — is resolved by [`useProductMatch`](/composables/useProductMatch.md) in the file rows and the [review step](/components/asset/AssetWizardReview.md). Takes no props — it reads and writes the injected wizard context.

## Usage

```vue
<!-- inside the manage step, above the file list -->
<AssetWizardProductLinking />
```

The checkbox defaults **on** (`linkProducts = true`). There is no field selector — a ref matches whichever of article number or product ID it hits, so a mixed batch links in one pass.
