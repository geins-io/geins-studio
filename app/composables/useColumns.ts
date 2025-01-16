import { h } from 'vue';
import type { ColumnDef, Table, Row, Column } from '@tanstack/vue-table';
import {
  Checkbox,
  NuxtLink,
  TableHeaderSort,
  TableCellActions,
  TableCellLongText,
} from '#components';
import type { ColumnOptions, ColumnType, ColumnTypes } from '#shared/types';

export const useColumns = <T extends object>() => {
  const basicCellStyle =
    'px-[1.2rem] align-middle text-xs leading-8 w-full h-10 flex items-center truncate';
  const basicHeaderTextStyle = 'text-xs font-medium uppercase';
  const basicHeaderStyle =
    'h-12 px-1.5 flex items-center ' + basicHeaderTextStyle;

  const selectableColumn: ColumnDef<T> = {
    id: 'select',
    header: ({ table }: { table: Table<T> }) =>
      h(
        'div',
        {
          class: cn(basicHeaderStyle, 'flex items-center justify-center px-1'),
        },
        h(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          'onUpdate:checked': (value: boolean) =>
            table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Select all',
        }),
      ),
    cell: ({ row }: { row: Row<T> }) =>
      h(
        'div',
        {
          class: cn(basicCellStyle, 'px-3 flex items-center justify-center'),
        },
        h(Checkbox, {
          checked: row.getIsSelected(),
          'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
          ariaLabel: 'Select row',
        }),
      ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
    maxSize: 40,
  };

  const getColumns = (
    data: T[],
    options: Partial<ColumnOptions<T>> = {},
  ): ColumnDef<T>[] => {
    const {
      selectable = false,
      sortable = true,
      columnTypes = {} as ColumnTypes<T>,
      maxTextLength = 60,
    } = options;
    const columns: ColumnDef<T>[] = [];

    const keys = data && data.length ? Object.keys(data[0] as object) : [];
    if (keys.length === 0) {
      return columns;
    }

    if (selectable) {
      columns.push(selectableColumn);
    }

    keys.forEach((key) => {
      let title = key;
      if (options.columnTitles?.[key as keyof T]) {
        title = options.columnTitles[key as keyof T] as string;
      } else {
        title = title.charAt(0).toUpperCase() + title.slice(1);
        title = title.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        title = title.toLowerCase();
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }

      // Set column type
      let columnType: ColumnType;
      // Infer column type based on key
      if (key.includes('date')) {
        columnType = 'date';
      } else if (key.includes('price') || key.includes('amount')) {
        columnType = 'currency';
      } else if (key.includes('image') || key.includes('img')) {
        columnType = 'image';
      } else {
        columnType = 'string';
      }
      // Override column type if explicitly set in options
      columnType = columnTypes[key as keyof T] || columnType;

      let columnSize = {
        size: 0,
        minSize: 0,
        maxSize: 0,
      };

      let cellRenderer;
      let headerRenderer = sortable
        ? ({ column }: { column: Column<T> }) => {
            return h(
              'div',
              { class: basicHeaderStyle },
              h(TableHeaderSort<T>, {
                column,
                title,
                className: basicHeaderTextStyle,
              }),
            );
          }
        : () => h('div', { class: basicHeaderStyle }, title);

      switch (columnType) {
        case 'currency':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            const formatted = new Intl.NumberFormat('sv-SE', {
              style: 'currency',
              currency: 'SEK',
              minimumFractionDigits: 0,
            }).format(Number(value));
            return h('div', { class: basicCellStyle }, formatted);
          };
          break;
        case 'image':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            return h('img', {
              src: value,
              alt: title,
              class: 'size-7 mx-auto max-w-10 p-0.5',
            });
          };
          headerRenderer = () =>
            h('div', { class: cn(basicHeaderStyle, 'px-2') }, '');
          columnSize = { size: 40, minSize: 40, maxSize: 40 };
          break;
        case 'link':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const match = options.editUrl?.match(/{([^}]+)}/);
            const pathKey = match ? match[1] : null;
            const editKey = row.getValue(pathKey || 'id') as string;
            const fullEditUrl = options.editUrl?.replace(
              `{${pathKey}}`,
              editKey,
            );
            const text = String(row.getValue(key));
            const link = h(
              NuxtLink,
              {
                to: fullEditUrl,
                class: cn(
                  'underline underline-offset-2 font-medium text-link hover:text-muted-foreground',
                ),
              },
              {
                default: () =>
                  text.length > maxTextLength
                    ? text.slice(0, maxTextLength) + '...'
                    : text,
              },
            );
            if (text.length > maxTextLength) {
              return h(
                TableCellLongText,
                { text, className: basicCellStyle, maxTextLength },
                { default: () => link },
              );
            }
            return h('div', { class: basicCellStyle }, link);
          };
          break;

        case 'date':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            const date = new Date(value as string | number | Date);
            const formatted = date.toLocaleDateString('sv-SE');
            return h('div', { class: basicCellStyle }, formatted);
          };
          break;
        default:
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const text = String(row.getValue(key));
            if (text.length > maxTextLength) {
              return h(TableCellLongText, {
                text,
                className: basicCellStyle,
                maxTextLength,
                default: () => text,
              });
            }
            return h('div', { class: basicCellStyle }, text);
          };
      }

      columns.push({
        id: key,
        accessorKey: key,
        header: headerRenderer,
        cell: cellRenderer,
        enableSorting: sortable,
        meta: { type: columnType, title },
        ...columnSize,
      });
    });

    return columns;
  };

  const extendColumns = (
    columns: ColumnDef<T>[],
    column: ColumnDef<T>,
  ): ColumnDef<T>[] => {
    columns.push(column);
    return columns;
  };

  const setOrderForColumn = (
    columns: ColumnDef<T>[],
    key: string,
    order: number,
  ): ColumnDef<T>[] => {
    // Find the index of the object with the given key
    const index = columns.findIndex((obj) => obj.id === key);

    // If the object is not found, return the original array
    if (index === -1) {
      console.error(`Key "${key}" not found in the array.`);
      return columns;
    }

    // Remove the object from the array
    const [item] = columns.splice(index, 1);

    if (item) {
      // Insert the object at the specified order position
      columns.splice(order, 0, item);
    }

    return columns;
  };

  const addActionsColumn = (
    columns: ColumnDef<T>[],
    props: object,
  ): ColumnDef<T>[] => {
    const actionsColumn: ColumnDef<T> = {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      size: 40,
      maxSize: 40,
      header: () =>
        h('div', {
          class: cn(basicHeaderStyle),
        }),
      cell: ({ row }) => {
        const rowData = row.original;
        return h(
          'div',
          { class: cn(basicCellStyle, 'relative px-2.5') },
          h(TableCellActions, { ...props, rowData }),
        );
      },
    };
    extendColumns(columns, actionsColumn);
    return columns;
  };

  const orderAndFilterColumns = (
    columns: ColumnDef<T>[],
    keys: string[],
  ): ColumnDef<T>[] => {
    const newColumns = keys
      .map((key) => columns.find((column) => column.id === key))
      .filter((column): column is ColumnDef<T> => column !== undefined);
    return newColumns.length ? newColumns : columns;
  };

  return {
    getColumns,
    extendColumns,
    setOrderForColumn,
    addActionsColumn,
    orderAndFilterColumns,
  };
};
