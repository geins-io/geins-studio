import type { VisibilityState } from '@tanstack/vue-table';

interface UseTableReturnType<T extends object> {
  getVisibilityState: (hiddenColumns: StringKeyOf<T>[]) => VisibilityState;
}

/**
 * Composable for table utilities and state management.
 *
 * Provides helper functions for managing table visibility states
 * and other table-related configurations.
 *
 * @template T - The type of data objects displayed in the table
 * @returns {UseTableReturnType<T>} - An object containing table utility functions
 * @property {function} getVisibilityState - Creates visibility state object from hidden columns array
 */
export const useTable = <T extends object>(): UseTableReturnType<T> => {
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
