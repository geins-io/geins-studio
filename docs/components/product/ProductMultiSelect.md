# `ProductMultiSelect`

A searchable, always-open product multi-select: a search field over a checkbox list (thumbnail, name, `articleNumber · id`). It renders **inline** — no popover — so it works inside a sheet or dialog without fighting their focus trap (a popover combobox inside the asset detail sheet lost its search input focus).

- **Search** matches name, article number or id (accent- and case-insensitive, Reka `useFilter`). It keeps its own state rather than `CommandInput`, which clears on every select.
- **At most 100 rows render**; past that a footer says to search to narrow it down. The full catalogue would be slow to render.
- **`lockedIds`** render checked and disabled, with `lockedLabel` as a trailing badge — e.g. products an asset is already linked to. They're never in the model.

Used by [`AssetLinkProductsDialog`](/components/asset/AssetLinkProductsDialog.md).

## Props

| Prop                     | Type               | Meaning                                           |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `products`               | `SelectorEntity[]` | The products to choose from (the products store). |
| `lockedIds`              | `string[]?`        | Shown checked + disabled.                         |
| `lockedLabel`            | `string?`          | Badge on locked rows.                             |
| `modelValue` (`v-model`) | `string[]`         | Selected product ids.                             |

## Usage

```vue
<ProductMultiSelect
  v-model="selected"
  :products="products"
  :locked-ids="alreadyLinked"
  :locked-label="$t('asset_library.picker_linked')"
/>
```
