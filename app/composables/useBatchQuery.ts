export const useBatchQuery = () => {
  const batchQueryAll = ref<BatchQuery>({
    page: 1,
    pageSize: 10000000,
    all: true,
  });
  return {
    batchQueryAll,
  };
};
