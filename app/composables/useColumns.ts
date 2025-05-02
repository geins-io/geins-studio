import { h } from 'vue';
import type { ColumnDef, Table, Row, Column } from '@tanstack/vue-table';
import {
  Checkbox,
  NuxtLink,
  TableHeaderSort,
  TableCellActions,
  TableCellDelete,
  TableCellLongText,
  TableCellChannels,
  TableCellTags,
} from '#components';
import type {
  ColumnOptions,
  ColumnType,
  ColumnTypes,
  StringKeyOf,
  TableRowAction,
} from '#shared/types';
import { TableMode } from '#shared/types';

export const useColumns = <T extends object>() => {
  // BASIC HEADER STYLE
  const basicHeaderTextStyle = 'text-xs font-semibold uppercase';

  const getBasicHeaderStyle = (table: Table<T>) => {
    const mode = table?.options?.meta?.mode || TableMode.Advanced;

    const baseStyle = 'px-1.5 flex items-center ' + basicHeaderTextStyle;
    const simpleStyle =
      'h-10 normal-case [&>button]:pl-2 [&>button]:pr-1 [&>button]:normal-case';
    const advancedStyle = 'h-12';
    const fullStyle =
      mode === TableMode.Simple
        ? `${baseStyle} ${simpleStyle}`
        : `${baseStyle} ${advancedStyle}`;

    return fullStyle;
  };

  // BASIC CELL STYLE
  const getBasicCellStyle = (table: Table<T>) => {
    const mode = table?.options?.meta?.mode || TableMode.Advanced;
    const baseStyle =
      'align-middle text-grid leading-8 w-full h-10 flex items-center truncate';
    const simpleStyle = '[&>button]:px-3.5 px-3.5';
    const advancedStyle = 'px-[1.2rem]';
    const fullStyle =
      mode === TableMode.Simple
        ? `${baseStyle} ${simpleStyle}`
        : `${baseStyle} ${advancedStyle}`;
    return fullStyle;
  };

  const selectableColumn: ColumnDef<T> = {
    id: 'select',
    header: ({ table }: { table: Table<T> }) =>
      h(
        'div',
        {
          class: cn(
            getBasicHeaderStyle(table),
            'flex items-center justify-center px-1',
          ),
        },
        h(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          'onUpdate:checked': (value: boolean) =>
            table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Select all',
        }),
      ),
    cell: ({ table, row }: { table: Table<T>; row: Row<T> }) =>
      h(
        'div',
        {
          class: cn(
            getBasicCellStyle(table),
            'px-3 flex items-center justify-center',
          ),
          'data-checkbox': true,
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
    meta: { type: 'select' },
  };

  const getColumns = (
    data: T[],
    options: Partial<ColumnOptions<T>> = {},
  ): ColumnDef<T>[] => {
    const {
      selectable = false,
      sortable = true,
      columnTypes,
      maxTextLength = 60,
    } = options;
    let columns: ColumnDef<T>[] = [];

    const keys: StringKeyOf<T>[] =
      data && data.length
        ? (Object.keys(data[0] as object) as StringKeyOf<T>[])
        : [];
    if (keys.length === 0) {
      return columns;
    }

    if (selectable) {
      columns.push(selectableColumn);
    }

    keys.forEach((key) => {
      if (
        key === '_type' ||
        options.excludeColumns?.includes(key) ||
        (options.includeColumns?.length &&
          !options.includeColumns.includes(key))
      ) {
        return;
      }

      // Set column title
      let columnTitle = String(key);
      if (options.columnTitles?.[key]) {
        columnTitle = options.columnTitles[key];
      } else {
        columnTitle = columnTitle.replace('_', '');
        columnTitle =
          columnTitle.charAt(0).toUpperCase() + columnTitle.slice(1);
        columnTitle = columnTitle.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        columnTitle = columnTitle.toLowerCase();
        columnTitle =
          columnTitle.charAt(0).toUpperCase() + columnTitle.slice(1);
      }

      // Set column type
      let columnType: ColumnType;
      const keyLower = key.toLowerCase();
      // Infer column type based on key
      if (keyLower.includes('date')) {
        columnType = 'date';
      } else if (keyLower.includes('price') || keyLower.includes('amount')) {
        columnType = 'currency';
      } else if (keyLower.includes('image') || keyLower.includes('img')) {
        columnType = 'image';
      } else if (keyLower === 'channels') {
        columnType = 'channels';
      } else if (keyLower === 'tags') {
        columnType = 'tags';
      } else {
        columnType = 'string';
      }
      // Override column type if explicitly set in options
      columnType = columnTypes?.[key] || columnType;

      let columnSize = {
        size: 0,
        minSize: 0,
        maxSize: 0,
      };

      let cellRenderer;
      let headerRenderer = sortable
        ? ({ table, column }: { table: Table<T>; column: Column<T> }) => {
            return h(
              'div',
              { class: getBasicHeaderStyle(table) },
              h(TableHeaderSort<T>, {
                column,
                title: columnTitle,
                className: basicHeaderTextStyle,
              }),
            );
          }
        : ({ table }: { table: Table<T> }) => {
            return h('div', { class: getBasicHeaderStyle(table) }, columnTitle);
          };

      switch (columnType) {
        case 'currency':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            const formatted = new Intl.NumberFormat('sv-SE', {
              style: 'currency',
              currency: 'SEK',
              minimumFractionDigits: 0,
            }).format(Number(value));
            return h('div', { class: getBasicCellStyle(table) }, formatted);
          };
          break;
        case 'image':
          cellRenderer = ({ row }: { row: Row<T> }) => {
            const value = row.getValue(key);
            return h(
              'span',
              { class: 'px-1.5 block' },
              h('img', {
                src: value,
                alt: columnTitle,
                class: 'size-7 mx-auto max-w-10 p-0.5',
              }),
            );
          };

          headerRenderer = ({ table }: { table: Table<T> }) =>
            h('div', {
              class: cn(getBasicHeaderStyle(table), 'px-2'),
            });
          columnSize = { size: 40, minSize: 40, maxSize: 40 };
          break;
        case 'entity-link':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const match = options.entityLinkUrl?.match(/{([^}]+)}/);
            const pathKey = match ? match[1] : null;
            const editKey = row.getValue(pathKey || '_id') as string;
            const fullEditUrl = options.entityLinkUrl?.replace(
              `{${pathKey}}`,
              editKey,
            );
            const text = String(row.getValue(key));
            const link = h(
              NuxtLink,
              {
                to: fullEditUrl,
                class: cn(
                  'underline underline-offset-2 font-semibold text-link hover:text-muted-foreground',
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
                {
                  text,
                  className: getBasicCellStyle(table),
                  maxTextLength,
                },
                { default: () => link },
              );
            }
            return h('div', { class: getBasicCellStyle(table) }, link);
          };
          break;

        case 'date':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            const date = new Date(value as string | number | Date);
            const formatted = date.toLocaleDateString('sv-SE');
            return h('div', { class: getBasicCellStyle(table) }, formatted);
          };
          break;
        case 'channels':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key) as Array<string>;
            return h(TableCellChannels, {
              class: getBasicCellStyle(table),
              channelIds: value,
            });
          };
          break;
        case 'tags':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key) as Array<string>;
            return h(TableCellTags, {
              class: getBasicCellStyle(table),
              tags: value,
            });
          };
          break;
        default:
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            let text = String(row.getValue(key));

            // Convert arrays to comma-separated strings
            if (Array.isArray(value)) {
              text = '';
              value.forEach((item: unknown, index) => {
                text += String(item);
                if (index < value.length - 1) {
                  text += ', ';
                }
              });
            }

            if (text.length > maxTextLength) {
              return h(TableCellLongText, {
                text,
                className: getBasicCellStyle(table),
                maxTextLength,
                default: () => text,
              });
            }
            return h('div', { class: getBasicCellStyle(table) }, text);
          };
      }

      columns.push({
        id: key,
        accessorKey: key,
        header: headerRenderer,
        cell: cellRenderer,
        enableSorting: sortable,
        meta: { type: columnType, title: columnTitle },
        ...columnSize,
      });
    });

    columns = columns.sort((a, b) => {
      const getOrder = (col: ColumnDef<T>) => {
        const id = col.id || '';
        const type = col.meta?.type || '';
        const title = col.meta?.title?.toLowerCase() || '';

        if (type === 'select') return 0;
        if (id === '_id') return 1;
        if (type === 'image') return 2;
        if (title === 'name') return 3;

        return 4;
      };
      return getOrder(a) - getOrder(b);
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

  const addActionsColumn = (
    columns: ColumnDef<T>[],
    props: object,
    type: 'actions' | 'delete' = 'actions',
    availableActions?: TableRowAction[],
  ): ColumnDef<T>[] => {
    const actionsColumn: ColumnDef<T> = {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      size: 40,
      maxSize: 40,
      header: ({ table }: { table: Table<T> }) =>
        h('div', {
          class: cn(getBasicHeaderStyle(table)),
        }),
      cell: ({ table, row }) => {
        const rowData = row.original;
        return h(
          'div',
          { class: cn(getBasicCellStyle(table), 'relative px-2.5') },
          h(type === 'actions' ? TableCellActions : TableCellDelete, {
            ...props,
            rowData,
            availableActions,
          }),
        );
      },
      meta: { type: 'actions' },
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
    addActionsColumn,
    orderAndFilterColumns,
  };
};
