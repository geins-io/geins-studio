interface UseBatchQueryReturnType {
  batchQueryMatchAll: Ref<BatchQuery>;
  batchQueryNoPagination: Ref<BatchQuery>;
}

/**
 * Utility composable that provides pre-configured BatchQuery objects
 * for common data fetching scenarios.
 *
 * @returns {UseBatchQueryReturnType} - An object containing pre-configured BatchQuery refs.
 * @property {Ref<BatchQuery>} batchQueryMatchAll - Ref for a BatchQuery that matches all items
 * @property {Ref<BatchQuery>} batchQueryNoPagination - Ref for a BatchQuery with no pagination (large page size)
 *
 * `all: true` is a match criterion, not a paging switch: the backend matches
 * every item regardless of any other filter in the body. Only spread
 * `batchQueryMatchAll` into unfiltered queries — never alongside filters.
 * Some routes cap `pageSize` (Geins.Media: 1000), where `batchQueryNoPagination`
 * is rejected.
 */
export const useBatchQuery = (): UseBatchQueryReturnType => {
  const batchQueryNoPagination = ref<BatchQuery>({
    page: 1,
    pageSize: 10000000,
  });
  const batchQueryMatchAll = ref<BatchQuery>({ all: true });

  return {
    batchQueryMatchAll,
    batchQueryNoPagination,
  };
};
