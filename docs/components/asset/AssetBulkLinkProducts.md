# `AssetBulkLinkProducts`

Properties pane of the asset library's bulk **Link to products** action (in [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet.md)). Bound with `v-model` to an `AssetBulkLinkValue` — `{ mode: BulkLinkMode, productIds: string[] }`.

- **Link as**, shaped by `composition` (what the selection holds, from `assetSelectionKind`). Only images and svgs can be a product image, so:

  | `composition` | Choices                                                                | Default  |
  | ------------- | ---------------------------------------------------------------------- | -------- |
  | `images`      | **Image** (`byType`) or **File** (`file`)                              | Image    |
  | `files`       | None — a line says they link as files                                  | `file`   |
  | `mixed`       | **Images as image, other files as file** (`byType`) or **All as file** | `byType` |

  A mixed selection also gets a line explaining the split. There is no "all as image" mode: `byType` never sends a non-image as `productimage`, so the `422` can't happen.

- **Products** — a [`ProductMultiSelect`](/components/product/ProductMultiSelect.md) over the products store. Individual products only.
- **Summary** — once products are picked, the `summary` prop's "N assets → M products (X links)" line. The page passes the same function as the action's confirm `summary`.

## Props

| Prop                     | Type                                    | Meaning                                            |
| ------------------------ | --------------------------------------- | -------------------------------------------------- |
| `composition`            | `AssetSelectionKind`                    | `images`, `files` or `mixed` — which choices show. |
| `summary`                | `(value: AssetBulkLinkValue) => string` | The count line, shared with the confirm step.      |
| `modelValue` (`v-model`) | `AssetBulkLinkValue`                    | Mode + picked product ids.                         |

## Usage

Configured as a `BulkAction` in `pages/asset-library/index.vue`:

```ts
const linkAction = computed<BulkAction<AssetBulkLinkValue>>(() => {
  const composition = assetSelectionKind(
    selectedIds.value.map((id) => assetTypes.get(id)),
  );
  return {
    key: 'link-to-products',
    component: AssetBulkLinkProducts,
    componentProps: { composition, summary: bulkLinkSummary },
    initialValue: () => ({
      mode: composition === 'files' ? 'file' : 'byType',
      productIds: [],
    }),
    run: async (ids, value, options) => {
      for (const call of bulkLinkCalls(
        ids,
        typeOf,
        value.mode,
        value.productIds,
      ))
        await assetApi.bulkLink(call.assetIds, call.links, options);
    },
    // …
  };
});
```
