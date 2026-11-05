import type { PriceListRuleField } from '#shared/types';

export interface UsePriceListPendingFieldsReturnType {
  /** Whether a row edit's preview is still working out this product's `field`. */
  isFieldPending: (productId: string, field: PriceListRuleField) => boolean;
  /**
   * Marks `field` of `productId` as edited until `preview` settles, success
   * or error. The row's other price fields are pending meanwhile.
   */
  trackEdit: (
    productId: string,
    field: PriceListRuleField,
    preview: () => Promise<unknown>,
  ) => Promise<void>;
}

/**
 * Which price fields of the grid's rows a preview is working out after a row
 * edit. Keyed per row, so a cell reading it re-renders only for its own row.
 */
export function usePriceListPendingFields(): UsePriceListPendingFieldsReturnType {
  const edits = shallowReactive(
    new Map<string, { field: PriceListRuleField; token: number }>(),
  );
  let lastToken = 0;

  const isFieldPending = (productId: string, field: PriceListRuleField) => {
    const edit = edits.get(productId);
    return !!edit && getRecalculatedPriceListFields(edit.field).includes(field);
  };

  const trackEdit = async (
    productId: string,
    field: PriceListRuleField,
    preview: () => Promise<unknown>,
  ) => {
    const token = ++lastToken;
    edits.set(productId, { field, token });
    try {
      await preview();
    } finally {
      // A newer edit of the row waits on a later preview, so it keeps the row.
      if (edits.get(productId)?.token === token) edits.delete(productId);
    }
  };

  return { isFieldPending, trackEdit };
}
