# `AssetLinkedProduct`

A compact **single row** shown at the top of the upload wizard's [manage step](/components/asset/AssetWizardManage.md) detail pane when the selected file links to a product (see [`useProductMatch`](/composables/useProductMatch.md)), and per product row in [`AssetUsedIn`](/components/asset/AssetUsedIn.md): product thumbnail + name (with a `Link2` marker), and the article number and id dot-separated in muted text beneath — a discreet confirmation of the match.

With `kind`, a trailing muted badge names the link kind — **Image** (`productimage`) or **File** (`productfile`). The wizard passes the kind the upload will link as (`productLinkTargetType` of the file's type); "Where it's used" passes the stored link's kind.

The thumbnail is a [`ProductThumbnail`](/components/product/ProductThumbnail.md) (built-in placeholder fallback); the image data comes free from the product list `useProductMatch` already fetches.

:::tip PHASE 2
Inherits STU-335's phase-2 caveat — the product data is fetched client-side for now. See the cutover ledger (`docs/domains/assets-cutover.md`).
:::

## Props

| Prop      | Type                   | Meaning                                                             |
| --------- | ---------------------- | ------------------------------------------------------------------- |
| `product` | `ProductMatch`         | The matched product (`_id`, `name`, `articleNumber`, `thumbnail?`). |
| `kind`    | `AssetLinkTargetType?` | Link kind for the trailing badge; omitted → no badge.               |

## Slots

| Slot      | Meaning                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `default` | Rendered at the end of the row, after the badge — "Where it's used" puts its remove-link button here. |

## Usage

```vue
<AssetLinkedProduct
  v-if="activeProduct"
  :product="activeProduct"
  :kind="productLinkTargetType(activeType)"
/>
```
