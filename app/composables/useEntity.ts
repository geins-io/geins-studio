export const useEntity = () => {
  const getEntityNameById = (id: string, dataList: EntityBaseWithName[]) => {
    const entity = dataList?.find((entity) => entity._id === id);
    return entity ? entity.name : '';
  };

  return {
    getEntityNameById,
  };
};
