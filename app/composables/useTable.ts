import type { VisibilityState } from '@tanstack/vue-table';
export const useTable = <T extends object>() => {
  const getVisibilityState = (
    hiddenColumns: StringKeyOf<T>[],
  ): VisibilityState => {
    const visibilityState: VisibilityState = {};
    hiddenColumns.forEach((column) => {
      visibilityState[column] = false;
    });
    return visibilityState;
  };
  return {
    getVisibilityState,
  };
};
