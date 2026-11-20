# `AssetWizardOrderLinking`

The whole-upload order-linking control in the [manage step](/components/asset/AssetWizardManage.md), under [`AssetWizardProductLinking`](/components/asset/AssetWizardProductLinking.md): a checkbox to link every file of the upload to one order and, once on, an [`OrderLookup`](/components/order/OrderLookup.md) to find it.

Writes straight into the shared wizard state via [`useUploadWizard`](/composables/useUploadWizard.md) (`linkToOrder`, `linkOrder`). On upload, `orderToLink` adds an `orderfile` link to each file's ticket claim next to any product link, so the order is linked when the upload completes, with no follow-up write. While the checkbox is on with no order found, **Next** stays disabled. Takes no props.

A private folder takes only order links: a file there that also matches a product is rejected (`ASSET_PRIVATE`), and the result screen says to turn off product linking or upload to a public folder.

## Usage

```vue
<!-- inside the manage step, under the product-linking control -->
<AssetWizardProductLinking />
<AssetWizardOrderLinking />
```

The checkbox defaults **off**.
