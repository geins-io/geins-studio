import { h } from 'vue';
import type { ColumnDef, Row } from '@tanstack/vue-table';
import { Skeleton } from '#components';

interface UseSkeletonReturnType {
  getSkeletonData: <T>(pageSize?: number) => T[];
  getSkeletonColumns: <T extends object>(data?: T[]) => ColumnDef<T>[];
}

/**
 * Composable for generating skeleton loading states for tables and data displays.
 *
 * Provides utilities for creating skeleton data and columns that can be used
 * as placeholders while loading actual content, with consistent styling.
 *
 * @returns {UseSkeletonReturnType} - An object containing skeleton generation utilities
 * @property {function} getSkeletonData - Generates array of skeleton data objects
 * @property {function} getSkeletonColumns - Creates skeleton column definitions for tables
 */
export const useSkeleton = (): UseSkeletonReturnType => {
  const getSkeletonData = <T>(pageSize = 30) => {
    const data: T[] = [];
    for (let i = 0; i < pageSize; i++) {
      data.push({
        index: i,
        id: 'id',
        name: 'name',
        data: 'data',
        data1: 'data1',
      } as T);
    }
    return data;
  };

  const getSkeletonColumns = <T extends object>(
    data: T[] = getSkeletonData(),
  ) => {
    if (data.length === 0) {
      return [];
    }

    const firstItem = data[0];
    if (!firstItem) {
      return [];
    }

    const keys = Object.keys(firstItem);
    if (keys.length === 0) {
      return [];
    }

    const columns: ColumnDef<T>[] = [];
    const cellRenderer = ({ row }: { row: Row<T> }) => {
      const value = Number(row.getValue('index'));
      const width = value % 2 === 0 ? 'w-2/5' : 'w-3/5';

      return h(
        'div',
        {
          class:
            'relative px-[1.2rem] align-middle text-xs leading-8 w-full h-10 flex items-center',
        },
        h(Skeleton, {
          class: `${width} h-5`,
        }),
      );
    };

    keys.forEach((key) => {
      columns.push({
        accessorKey: key,
        header: () =>
          h(
            'div',
            { class: 'relative h-12 px-[1.2rem] flex items-center' },
            h(Skeleton, {
              class: 'w-4/5 h-6',
            }),
          ),
        cell: cellRenderer,
      });
    });

    return columns;
  };

  return {
    getSkeletonData,
    getSkeletonColumns,
  };
};
