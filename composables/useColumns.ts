import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';

export const useColumns = () => {
  const getColumns = (data: object[]) => {
    const keys = Object.keys(data[0]);
    if (keys.length === 0) {
      return [];
    }

    const columns: ColumnDef<object>[] = [];

    keys.forEach((key) => {
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      columns.push({
        accessorKey: key,
        header: () => h('div', title),
      });
    });
    return columns;
  };

  return {
    getColumns,
  };
};
