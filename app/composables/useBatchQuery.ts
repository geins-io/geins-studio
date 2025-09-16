export const useBatchQuery = () => {
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
