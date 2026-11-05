# `usePriceListPendingFields`

The `usePriceListPendingFields` composable tracks which price fields of the price list grid's rows a preview is still working out after a row edit, so their cells can show a loader until the new values arrive.

:::warning NOTE
Built for [`usePriceListEditor`](usePriceListEditor.md), which feeds it to the grid's cells through [`usePriceListProductsTable`](usePriceListProductsTable.md).
:::

## Features

- **Other two fields**: editing a row's list price, discount or margin marks the row's other two (`getRecalculatedPriceListFields`), as in `PriceListRule`
- **Always clears**: the row clears when its preview settles, success or error
- **Rows apart**: each row clears on its own preview; a newer edit of the same row keeps it until the newer preview settles
- **Per-row reactivity**: kept in a `shallowReactive` `Map`, so a cell reading one row re-renders only when that row changes

## Usage

```ts
const pendingFields = usePriceListPendingFields();

const cellEditCallback = (value, row, field: PriceListRuleField) => {
  addToPriceListProducts(/* … */);
  pendingFields.trackEdit(row.original._id, field, () =>
    previewPriceList(t('price_updated_for', { /* … */ })),
  );
};

// In a cell: the margin input's loader
loading: (row) => pendingFields.isFieldPending(row.original._id, 'margin'),
```

## Properties and Methods

### `trackEdit`

```ts
trackEdit(
  productId: string,
  field: PriceListRuleField,
  preview: () => Promise<unknown>,
): Promise<void>
```

Marks `field` of `productId` as edited, runs `preview` and clears the row once it settles — resolved or rejected (a rejection is passed on). Pair it with [`previewPriceList`](usePriceListPreview.md#previewpricelist), whose promise settles once the preview that includes the edit does, even when it was made while another preview ran.

### `isFieldPending`

```ts
isFieldPending(productId: string, field: PriceListRuleField): boolean
```

Whether a row edit's preview is still working out this product's `field`: true for the row's fields other than the edited one while its preview runs.

## Type Definitions

```ts
function usePriceListPendingFields(): UsePriceListPendingFieldsReturnType;

interface UsePriceListPendingFieldsReturnType {
  isFieldPending: (productId: string, field: PriceListRuleField) => boolean;
  trackEdit: (
    productId: string,
    field: PriceListRuleField,
    preview: () => Promise<unknown>,
  ) => Promise<void>;
}
```

## Dependencies

1. **`getRecalculatedPriceListFields`** from `#shared/utils/price-list`
2. **Vue** `shallowReactive`
