# `AssetLinkedProduct`

A compact, read-only **single row** shown at the top of the upload wizard's [manage step](/components/asset/AssetWizardManage.md) detail pane when the selected image links to a product (see [`useProductMatch`](/composables/useProductMatch.md)): product thumbnail + name (with a `Link2` marker), and the article number and id dot-separated in muted text beneath — a discreet confirmation of the match.

The thumbnail is a [`ProductThumbnail`](/components/product/ProductThumbnail.md) (built-in placeholder fallback); the image data comes free from the product list `useProductMatch` already fetches.

:::tip PHASE 2
Inherits STU-335's phase-2 caveat — the product data is fetched client-side for now. See the cutover ledger (`docs/domains/assets-cutover.md`).
:::

## Props

| Prop      | Type           | Meaning                                                             |
| --------- | -------------- | ------------------------------------------------------------------- |
| `product` | `ProductMatch` | The matched product (`_id`, `name`, `articleNumber`, `thumbnail?`). |

## Usage

```vue
<AssetLinkedProduct v-if="activeProduct" :product="activeProduct" />
```
