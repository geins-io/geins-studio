# `ProductThumbnail`

A product image with a **built-in placeholder fallback**. Wraps the Geins image-URL builder (`useGeinsImage().getProductThumbnail`) and the shared `handleImageError` handler, so callers never re-implement the `<img @error>` dance: pass a product image slug and get a square thumbnail that degrades to `/placeholder.svg` when the slug is missing or the image fails to load.

Used by [`TableCellProduct`](/components/table/cell/TableCellProduct.md) (product table rows) and [`AssetLinkedProduct`](/components/asset/AssetLinkedProduct.md); reach for it anywhere a product image is shown.

## Props

| Prop    | Type                       | Default | Meaning                                                            |
| ------- | -------------------------- | ------- | ------------------------------------------------------------------ |
| `src`   | `string?`                  | `''`    | Product image slug/path (the product's `thumbnail`/`imageUrl`).    |
| `alt`   | `string?`                  | `''`    | Alt text.                                                          |
| `class` | `HTMLAttributes['class']?` | —       | Extra classes; overrides the default `size-10` via tailwind-merge. |

## Usage

```vue
<!-- default size-10 square -->
<ProductThumbnail :src="product.thumbnail" :alt="product.name" />

<!-- smaller, in a dense row -->
<ProductThumbnail :src="product.thumbnail" :alt="product.name" class="size-8" />
```
