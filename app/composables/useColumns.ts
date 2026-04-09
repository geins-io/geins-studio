import { h } from 'vue';
import type { ColumnDef, Table, Row, Column } from '@tanstack/vue-table';
import {
  Checkbox,
  NuxtLink,
  TableHeaderSort,
  TableCellActions,
  TableCellDelete,
  TableCellEdit,
  TableCellLongText,
  TableCellChannels,
  TableCellTags,
  TableCellStatus,
  TableCellTooltip,
  TableCellBoolean,
  TableCellEditable,
  TableCellCurrency,
  TableCellProduct,
  TableCellFlag,
  TableCellSwitch,
  Button,
  LucideChevronRight,
  LucideExternalLink,
} from '#components';

interface UseColumnsReturnType<T> {
  getBasicHeaderStyle: (table: Table<T>) => string;
  getBasicCellStyle: (table: Table<T>) => string;
  getColumns: (
    data: T[],
    options?: Partial<ColumnOptions<T>>,
  ) => ColumnDef<T>[];
  extendColumns: (
    columns: ColumnDef<T>[],
    column: ColumnDef<T>,
  ) => ColumnDef<T>[];
  addActionsColumn: (
    columns: ColumnDef<T>[],
    props: object,
    type?: 'actions' | 'delete' | 'edit',
    availableActions?: TableRowAction[],
  ) => ColumnDef<T>[];
  addExpandingColumn: (columns: ColumnDef<T>[]) => ColumnDef<T>[];
  orderAndFilterColumns: (
    columns: ColumnDef<T>[],
    keys: ColumnKey<T>[],
  ) => ColumnDef<T>[];
  orderColumnLast: (
    columns: ColumnDef<T>[],
    key: ColumnKey<T>,
  ) => ColumnDef<T>[];
  setColumnOrder: (
    columns: ColumnDef<T>[],
    key: ColumnKey<T>,
    order: number,
  ) => ColumnDef<T>[];
}

/**
 * Composable for generating and managing data table columns with automatic type inference,
 * styling, and advanced features. Provides comprehensive utilities for creating columns
 * with multiple types, editable cells, actions, and responsive design patterns.
 *
 * Designed to work seamlessly with `@tanstack/vue-table` and supports automatic column
 * generation from data with intelligent type inference, custom styling, and localization.
 *
 * @template T - The type of data objects that will be displayed in the table
 * @returns {UseColumnsReturnType<T>} - An object containing column generation and management utilities
 * @property {function} getBasicHeaderStyle - Generate responsive header styling classes for table mode
 * @property {function} getBasicCellStyle - Generate responsive cell styling classes for table mode
 * @property {function} getColumns - Generate column definitions from data with automatic type inference
 * @property {function} extendColumns - Add a custom column to existing column definitions
 * @property {function} addActionsColumn - Add action column with edit, delete, or custom actions
 * @property {function} orderAndFilterColumns - Reorder and filter columns by specified keys
 * @property {function} orderColumnLast - Move a specific column to the end of the columns array
 *
 */
export const useColumns = <T>(): UseColumnsReturnType<T> => {
  const viewport = useViewport();
  const accountStore = useAccountStore();
  const { currentCurrency: _currentCurrency } = storeToRefs(accountStore);
  const { formatDate } = useDate();
  const { handleImageError } = useGeinsImage();

  // BASIC HEADER STYLE
  const basicHeaderTextStyle = 'text-xs font-semibold uppercase';
  const minimalHeaderTextStyle = 'text-xs font-semibold normal-case';
  const getBasicHeaderStyle = (table: Table<T>) => {
    const mode = table?.options?.meta?.mode || TableMode.Advanced;

    if (mode === TableMode.Minimal) {
      return `px-0.5 sm:px-1.5 flex items-center whitespace-nowrap h-8 sm:h-10 ${minimalHeaderTextStyle}`;
    }

    const baseStyle =
      'px-0.5 sm:px-1.5 flex items-center whitespace-nowrap ' +
      basicHeaderTextStyle;
    const simpleStyle =
      'h-8 sm:h-10 normal-case [&>button]:pl-2 [&>button]:pr-1 [&>button]:normal-case';
    const advancedStyle = 'h-10 sm:h-12';
    const fullStyle =
      mode === TableMode.Simple
        ? `${baseStyle} ${simpleStyle}`
        : `${baseStyle} ${advancedStyle}`;

    return fullStyle;
  };

  // BASIC CELL STYLE
  const getBasicCellStyle = (table: Table<T>) => {
    const mode = table?.options?.meta?.mode || TableMode.Advanced;

    if (mode === TableMode.Minimal) {
      return 'align-middle sm:text-grid leading-6 text-xs sm:leading-8 w-full h-[68px] flex items-center truncate px-3.5';
    }

    const baseStyle =
      'align-middle sm:text-grid leading-6 text-xs sm:leading-8 w-full h-8 sm:h-10 flex items-center truncate';
    const simpleStyle = 'px-3.5';
    const advancedStyle = 'px-3.5 sm:px-[1.2rem]';
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
          modelValue: table.getIsAllPageRowsSelected(),
          'onUpdate:model-value': (value: boolean) =>
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
          modelValue: row.getIsSelected(),
          'onUpdate:model-value': (value: boolean) =>
            row.toggleSelected(!!value),
          ariaLabel: 'Select row',
        }),
      ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
    maxSize: 40,
    meta: { type: 'select' },
  };

  const expandingColumn: ColumnDef<T> = {
    id: 'expander',
    header: ({ table }: { table: Table<T> }) =>
      h('div', {
        class: cn(getBasicHeaderStyle(table)),
      }),
    cell: ({ row, table }) => {
      return h(
        'div',
        {
          class: cn(getBasicCellStyle(table), ''),
        },
        row.getCanExpand()
          ? [
              h(
                Button,
                {
                  onClick: row.getToggleExpandedHandler(),
                  class: 'inline-flex items-center justify-center',
                  variant: 'outline',
                  size: 'icon-xs',
                },
                () =>
                  h(LucideChevronRight, {
                    class:
                      'size-4 transition-transform' +
                      (row.getIsExpanded() ? ' rotate-90' : ''),
                  }),
              ),
            ]
          : [],
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 48,
    maxSize: 48,
    meta: { type: 'default' },
  };

  const getColumns = (
    data: T[],
    options: Partial<ColumnOptions<T>> = {},
  ): ColumnDef<T>[] => {
    const {
      selectable = false,
      sortable = true,
      columnTypes,
      sortableColumns,
      maxTextLength = 60,
      columnCellProps,
    } = options;
    let columns: ColumnDef<T>[] = [];

    const keys: StringKeyOf<T>[] =
      data && data.length
        ? (Object.keys(data[0] as object) as StringKeyOf<T>[])
        : [];
    if (keys.length === 0) {
      return columns;
    }

    // If selectable, push the selectable column first
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

      // Extract cell props for this column
      const cellProps =
        columnCellProps && key in columnCellProps
          ? columnCellProps[key] || {}
          : {};

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
      } else if (
        keyLower.includes('image') ||
        keyLower.includes('img') ||
        keyLower.includes('thumbnail')
      ) {
        columnType = 'image';
      } else if (keyLower === 'channels') {
        columnType = 'channels';
      } else if (keyLower === 'tags') {
        columnType = 'tags';
      } else if (keyLower === 'active' || keyLower === 'status') {
        columnType = 'status';
      } else {
        columnType = 'default';
      }
      // Override column type if explicitly set in options
      columnType = columnTypes?.[key] || columnType;

      let columnSize = {
        size: 0,
        minSize: 0,
        maxSize: 0,
      };

      const colSortable =
        sortableColumns?.[key] !== undefined ? sortableColumns[key] : sortable;

      let cellRenderer;
      let headerRenderer = colSortable
        ? ({ table, column }: { table: Table<T>; column: Column<T> }) => {
            const mode = table?.options?.meta?.mode || TableMode.Advanced;
            // Minimal mode: plain text headers, no sort buttons
            if (mode === TableMode.Minimal) {
              return h(
                'div',
                { class: cn(getBasicHeaderStyle(table), 'px-3 sm:px-3') },
                columnTitle,
              );
            }
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
            return h(
              'div',
              {
                class: cn(getBasicHeaderStyle(table), 'px-3 sm:px-3'),
              },
              columnTitle,
            );
          };

      const getEditableColumn = (type: EditableColumnType) => {
        return ({
          table,
          row,
          column,
        }: {
          table: Table<T>;
          row: Row<T>;
          column: Column<T>;
        }) => {
          return h(TableCellEditable<T>, {
            table,
            row,
            column,
            colKey: key,
            type,
            className: getBasicCellStyle(table),
            ...cellProps,
          });
        };
      };

      switch (columnType) {
        case 'product':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const name = String(row.getValue(key) ?? '');
            const original = row.original as Record<string, unknown>;
            return h(
              'div',
              { class: cn(getBasicCellStyle(table), 'px-3 sm:px-3') },
              h(TableCellProduct, {
                name,
                articleNumber: String(original.articleNumber ?? ''),
                imageUrl: String(
                  original.image ??
                    original.thumbnail ??
                    original.primaryImage ??
                    '',
                ),
              }),
            );
          };
          break;
        case 'image':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            return h(
              'div',
              {
                class: cn(getBasicCellStyle(table), 'px-1'),
              },

              h('img', {
                src: value,
                alt: columnTitle,
                class: 'size-7 mx-auto max-w-10 p-0.5 rounded-md object-cover',
                onerror: handleImageError,
              }),
            );
          };

          headerRenderer = ({ table }: { table: Table<T> }) =>
            h('div', {
              class: cn(getBasicHeaderStyle(table), 'px-2'),
            });
          columnSize = { size: 40, minSize: 40, maxSize: 40 };
          break;
        case 'icon': {
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const iconConfig = options.iconColumns?.[key];
            if (!iconConfig) {
              return h('div', { class: getBasicCellStyle(table) });
            }

            // Resolve icon: static or per-row via resolveIcon()
            let iconComponent = iconConfig.icon;
            let iconClass = 'size-4 shrink-0 text-muted-foreground';

            if (iconConfig.resolveIcon) {
              const resolved = iconConfig.resolveIcon(row.original);
              if (resolved) {
                iconComponent = resolved.icon;
                if (resolved.class) {
                  iconClass = `size-4 shrink-0 ${resolved.class}`;
                }
              }
            }

            if (!iconComponent) {
              const text = String(row.getValue(key) ?? '');
              return h('div', { class: getBasicCellStyle(table) }, text);
            }

            const iconEl = h(
              iconComponent as ReturnType<typeof defineComponent>,
              {
                class: iconClass,
              },
            );

            const text = String(row.getValue(key) ?? '');
            const hasText = text.length > 0 && text !== 'undefined';

            const children = hasText
              ? [iconEl, h('span', { class: 'truncate' }, text)]
              : [iconEl];

            const cellClass = hasText
              ? cn(getBasicCellStyle(table), 'gap-1.5')
              : cn(getBasicCellStyle(table), 'justify-center');

            if (iconConfig.url && iconConfig.idField) {
              const original = row.original as Record<string, unknown>;
              const idValue = String(
                original[iconConfig.idField] ??
                  row.getValue(iconConfig.idField),
              );
              const fullUrl = iconConfig.url.replace('{id}', idValue);
              return h(
                'div',
                { class: cellClass },
                h(
                  NuxtLink,
                  {
                    to: fullUrl,
                    class:
                      'flex items-center gap-1.5 hover:text-foreground transition-colors',
                  },
                  { default: () => children },
                ),
              );
            }

            return h('div', { class: cellClass }, children);
          };
          break;
        }
        case 'link':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const linkConfig = options.linkColumns?.[key];
            const text = String(row.getValue(key));
            let fullUrl: string | undefined;
            let isExternal = false;

            if (linkConfig) {
              isExternal = !!linkConfig.external;

              if (linkConfig.useValueAsUrl) {
                // Use the cell value itself as the URL
                fullUrl = text || undefined;
              } else if (linkConfig.idField && linkConfig.url) {
                // Internal link with ID replacement
                const idValue = String(row.getValue(linkConfig.idField));
                if (idValue) {
                  fullUrl = linkConfig.url.replace('{id}', idValue);
                }
              } else if (linkConfig.url) {
                // Static URL
                fullUrl = linkConfig.url;
              }
            }

            if (!fullUrl || text === '–' || text === '-') {
              // Fallback to plain text if no URL resolved or value is a placeholder
              return h('div', { class: getBasicCellStyle(table) }, text);
            }

            const displayText =
              text.length > maxTextLength
                ? text.slice(0, maxTextLength) + '...'
                : text;

            const linkClass = isExternal ? 'external-link-text' : 'link-text';

            const link = isExternal
              ? h(
                  'a',
                  {
                    href: fullUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    class: linkClass,
                  },
                  [
                    displayText,
                    h(LucideExternalLink, {
                      class:
                        'inline-block ml-0.5 size-3 align-baseline opacity-60',
                    }),
                  ],
                )
              : h(
                  NuxtLink,
                  { to: fullUrl, class: linkClass },
                  { default: () => displayText },
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
            if (!value) {
              return h('div', { class: getBasicCellStyle(table) }, '---');
            }
            const formatted = formatDate(value as string | Date);
            return h(
              'div',
              { class: getBasicCellStyle(table) },
              formatted || String(value),
            );
          };
          break;
        case 'channels':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            let value: string[] = row.getValue(key);
            if (!Array.isArray(value)) {
              value = [String(value)];
            }
            return h(TableCellChannels, {
              class: getBasicCellStyle(table),
              channelIds: value,
              ...cellProps,
            });
          };
          break;
        case 'tags':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            if (!Array.isArray(value)) {
              return h(
                'div',
                { class: getBasicCellStyle(table) },
                String(value),
              );
            }
            return h(TableCellTags, {
              class: getBasicCellStyle(table),
              tags: value,
              ...cellProps,
            });
          };
          break;
        case 'status':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            if (typeof value !== 'string' && typeof value !== 'boolean') {
              return h(
                'div',
                { class: getBasicCellStyle(table) },
                String(value),
              );
            }
            return h(TableCellStatus, {
              class: getBasicCellStyle(table),
              status: value as StatusBadgeStatus,
              ...cellProps,
            });
          };
          break;
        case 'tooltip':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value: Tooltip = row.getValue(key);
            return h(TableCellTooltip, {
              class: getBasicCellStyle(table),
              ...value,
              ...cellProps,
            });
          };
          break;
        case 'currency':
          cellRenderer = ({ row, table }: { row: Row<T>; table: Table<T> }) => {
            const price = row.getValue(key);
            let priceValue: string = '';
            let priceCurrency: string = 'XXX';

            if (
              typeof price === 'object' &&
              price !== null &&
              'price' in price &&
              'currency' in price
            ) {
              priceValue = price.price ? String(price.price) : '---';
              priceCurrency = price.currency ? String(price.currency) : 'XXX';
            }

            return h(TableCellCurrency, {
              price: priceValue,
              currency: priceCurrency,
              className: getBasicCellStyle(table),
              ...cellProps,
            });
          };
          columnSize = { size: 134, minSize: 134, maxSize: 134 };
          break;

        case 'editable-currency':
          cellRenderer = ({
            table,
            row,
            column,
          }: {
            table: Table<T>;
            row: Row<T>;
            column: Column<T>;
          }) => {
            const price = row.getValue(key);
            let priceValue: string | undefined = '';
            let priceCurrency: string = 'XXX';
            let placeholder: string = '';

            if (
              typeof price === 'object' &&
              price !== null &&
              'price' in price &&
              'currency' in price
            ) {
              priceValue = price.price ? String(price.price) : '';
              priceCurrency = String(price.currency);
            }

            if (
              typeof price === 'object' &&
              price !== null &&
              'placeholder' in price &&
              price.placeholder
            ) {
              placeholder = String(price.placeholder);
            }

            return h(TableCellEditable<T>, {
              table,
              row,
              column,
              colKey: key,
              type: 'currency',
              className: getBasicCellStyle(table),
              initialValue: priceValue,
              valueDescriptor: priceCurrency,
              placeholder,
              ...cellProps,
            });
          };
          columnSize = { size: 180, minSize: 180, maxSize: 180 };
          break;
        case 'editable-string':
        case 'editable-number':
        case 'editable-percentage': {
          const editableType = columnType.replace(
            'editable-',
            '',
          ) as EditableColumnType;
          cellRenderer = getEditableColumn(editableType);
          columnSize = { size: 134, minSize: 134, maxSize: 134 };
          break;
        }
        case 'flag':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value: FlagText = row.getValue(key);
            return h(TableCellFlag, {
              class: getBasicCellStyle(table),
              ...value,
              ...cellProps,
            });
          };
          break;
        case 'switch':
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value: boolean = row.getValue(key);
            return h(
              'div',
              { class: getBasicCellStyle(table) },
              h(TableCellSwitch, {
                value,
                onChange: (
                  cellProps?.onChange as
                    | ((row: Row<T>) => (value: boolean) => void)
                    | undefined
                )?.(row),
                disabled: (
                  cellProps?.disabled as ((row: Row<T>) => boolean) | undefined
                )?.(row),
              }),
            );
          };
          break;
        default:
          cellRenderer = ({ table, row }: { table: Table<T>; row: Row<T> }) => {
            const value = row.getValue(key);
            let text = String(row.getValue(key) ?? '');

            if (typeof value === 'boolean') {
              return h(TableCellBoolean, {
                className: getBasicCellStyle(table),
                isTrue: value,
                ...cellProps,
              });
            }

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
                ...cellProps,
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
        if (type === 'status') return 5;

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
    if (!column.header) {
      column.header = ({ table }: { table: Table<T> }) =>
        h('div', {
          class: cn(getBasicHeaderStyle(table)),
        });
    }
    columns.push(column);
    return columns;
  };

  const addActionsColumn = (
    columns: ColumnDef<T>[],
    props: object,
    type: 'actions' | 'delete' | 'edit' = 'actions',
    availableActions?: TableRowAction[],
  ): ColumnDef<T>[] => {
    const actionsColumn: ColumnDef<T> = {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      size: viewport.isGreaterThan('sm') ? 49 : 45,
      maxSize: viewport.isGreaterThan('sm') ? 49 : 45,
      minSize: viewport.isGreaterThan('sm') ? 49 : 45,
      header: ({ table }: { table: Table<T> }) =>
        h('div', {
          class: cn(getBasicHeaderStyle(table)),
        }),
      cell: ({ table, row }) => {
        const rowData = row.original;
        return h(
          'div',
          {
            class: cn(
              getBasicCellStyle(table),
              'relative px-2.5 sm:px-2.5 justify-center',
            ),
          },
          h(getActionsComponent(type), {
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

  const getActionsComponent = (
    type: 'actions' | 'delete' | 'edit' = 'actions',
  ) => {
    const component =
      {
        actions: TableCellActions,
        delete: TableCellDelete,
        edit: TableCellEdit,
      }[type] || TableCellActions;
    return component;
  };

  const orderAndFilterColumns = (
    columns: ColumnDef<T>[],
    keys: ColumnKey<T>[],
  ): ColumnDef<T>[] => {
    const newColumns = keys
      .map((key) => columns.find((column) => column.id === key))
      .filter((column): column is ColumnDef<T> => column !== undefined);
    return newColumns.length ? newColumns : columns;
  };

  const orderColumnLast = (
    columns: ColumnDef<T>[],
    key: ColumnKey<T>,
  ): ColumnDef<T>[] => {
    const column = columns.find((column) => column.id === key);
    if (!column) {
      return columns;
    }
    const newColumns = columns.filter((col) => col.id !== key);
    newColumns.push(column);
    return newColumns;
  };

  const setColumnOrder = (
    columns: ColumnDef<T>[],
    key: ColumnKey<T>,
    order: number,
  ): ColumnDef<T>[] => {
    const idx = columns.findIndex((col) => col.id === key);
    if (idx === -1) return columns;
    const col = columns[idx];
    if (!col) return columns;
    const filtered = columns.filter((c, i) => i !== idx);
    filtered.splice(order, 0, col);
    return filtered;
  };

  const addExpandingColumn = (columns: ColumnDef<T>[]): ColumnDef<T>[] => {
    // Add expander column at the beginning
    columns.unshift(expandingColumn);
    return columns;
  };

  return {
    getBasicHeaderStyle,
    getBasicCellStyle,
    getColumns,
    extendColumns,
    addActionsColumn,
    orderAndFilterColumns,
    orderColumnLast,
    setColumnOrder,
    addExpandingColumn,
  };
};
