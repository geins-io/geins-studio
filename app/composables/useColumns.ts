import { h } from 'vue';
import type { ColumnDef, Table, Row } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { Button, Checkbox } from '#components';
import type { ColumnOptions } from '../../../types/Columns';

export const useColumns = <T extends object>() => {
  const selectableColumn: ColumnDef<T> = {
    id: 'select',
    header: ({ table }: { table: Table<T> }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        'onUpdate:checked': (value: boolean) =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all',
      }),
    cell: ({ row }: { row: Row<T> }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        ariaLabel: 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  };

  const getColumns = (data: T[], options: Partial<ColumnOptions> = {}) => {
    const { selectable = false, sortable = true, columnTypes = {} } = options;

    const keys = Object.keys(data[0]);
    if (keys.length === 0) {
      return [];
    }

    const columns: ColumnDef<T>[] = [];

    if (selectable) {
      columns.push(selectableColumn);
    }

    keys.forEach((key) => {
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      const columnType = columnTypes[key] || 'string';
      let cellRenderer;

      switch (columnType) {
        case 'currency':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            const formatted = new Intl.NumberFormat('sv-SE', {
              style: 'currency',
              currency: 'SEK',
              minimumFractionDigits: 0,
            }).format(Number(value));
            return h('div', { class: 'pl-3' }, formatted);
          };
          break;
        case 'image':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            return h('img', { src: value, alt: title, class: 'size-8 ml-3' });
          };
          break;
        // case 'date':
        //   cellRenderer = ({ row }: { row: Row<T> }) => {
        //     const value = row.getValue(key);
        //     if (
        //       typeof value !== 'string' ||
        //       typeof value !== 'number') {
        //       return;
        //     }
        //     const formatted = new Intl.DateTimeFormat('sv-SE').format(
        //       new Date(value),
        //     );
        //     return h('div', { class: '' }, formatted);
        //   };
        //   break;
        default:
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);

            if (typeof value === 'string' || typeof value === 'number') {
              return h('div', { class: 'pl-3' }, value);
            }
          };
      }

      columns.push({
        accessorKey: key,
        header: sortable
          ? ({ column }) => {
              return h(
                Button,
                {
                  variant: 'ghost',
                  size: 'sm',
                  class: 'text-md',
                  onClick: () =>
                    column.toggleSorting(column.getIsSorted() === 'asc'),
                },
                () => [title, h(ArrowUpDown, { class: 'ml-1.5 size-3.5' })],
              );
            }
          : () => h('div', title),
        cell: cellRenderer,
        enableSorting: sortable,
      });
    });

    return columns;
  };

  const extendColumns = (columns: ColumnDef<T>[], column: ColumnDef<T>) => {
    columns.push(column);
    return columns;
  };

  return {
    getColumns,
    extendColumns,
  };
};
