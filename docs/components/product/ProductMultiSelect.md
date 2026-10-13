# `ProductMultiSelect`

A compact product multi-select in three parts, from top to bottom:

- **Add by search.** A labelled search (placeholder "Search by name, article number or product id") that matches name, article number or id (accent- and case-insensitive, Reka `useFilter`) and opens the results in a **popover** anchored to the field — the full catalogue is never listed. Clicking a result toggles it (check / plus icon) and keeps the popover open for the next pick; Escape or a click outside closes it. Focus stays in the search field (`open-auto-focus`/`close-auto-focus` prevented). At most 100 results render; past that a footer says to narrow the search. Search keeps its own state rather than `CommandInput`, which clears on every select.
- **Add by pasting ids.** A labelled input (with the **Add** / **Replace** segmented choice on the label row and an `outline` **Select** button (same height as the toggle) inside an `InputGroup`) for a list of article numbers or product ids, separated by commas, semicolons, spaces or new lines — line breaks from a pasted spreadsheet column become separators, and Enter applies it. **Add** (default) adds the matches to the selection, **Replace** swaps the selection for them. Refs resolve through [`useProductMatch`](/composables/useProductMatch.md)`.matchById` (article number or id, case-insensitive, leading-zero tolerant); the pure combine step is `applyProductRefPaste` (`#shared/utils/asset`). Locked products, repeated refs and existing picks are skipped; unmatched refs are listed under the input ("2 not found: ABC-1, 0999") so a typo isn't silently dropped. A replace that matches nothing leaves the selection alone.
- **Selected products.** Only the picks, one row each (thumbnail, name, `articleNumber · id`) with a remove button, in a list that scrolls past `max-h-52` (about 5 rows). "No products selected" when empty.

**`lockedIds`** (e.g. products an asset is already linked to) show in the search results disabled, with `lockedLabel` as a badge. They're never in the model.

The products store loads lazily, so callers call `useProductsStore().init()` and pass `loading` until it's `initialized`.

Used by [`AssetLinkProductsDialog`](/components/asset/AssetLinkProductsDialog.md) and the bulk [`AssetBulkLinkProducts`](/components/asset/AssetBulkLinkProducts.md) pane.

## Props

| Prop                     | Type               | Meaning                                           |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `products`               | `SelectorEntity[]` | The products to choose from (the products store). |
| `lockedIds`              | `string[]?`        | Disabled in the search results.                   |
| `lockedLabel`            | `string?`          | Badge on locked rows.                             |
| `loading`                | `boolean?`         | Skeleton results + paste disabled while loading.  |
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
