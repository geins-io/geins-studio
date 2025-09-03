import type { ColumnDef, Row } from '@tanstack/vue-table';
import type { PricelistProductList } from '#shared/types';
import { PricelistQtyLevelsCell, PricelistPriceModeCell } from '#components';

export const usePricelistProductsTable = () => {
  const { t } = useI18n();
  const {
    getBasicCellStyle,
    getBasicHeaderStyle,
    getColumns,
    addActionsColumn,
    extendColumns,
  } = useColumns<PricelistProductList>();

  const setupPricelistColumns = (
    selectedProducts: PricelistProductList[],
    vatDescription: string,
    onEditQuantityLevels: (id: string) => void,
    onDeleteProduct: (id: string) => void,
    onPriceBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
    onMarginBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
    onDiscountBlur: (
      value: string | number,
      row: Row<PricelistProductList>,
    ) => void,
  ) => {
    const columnOptions: ColumnOptions<PricelistProductList> = {
      columnTypes: {
        listPrice: 'editable-currency',
        discount: 'editable-percentage',
        margin: 'editable-percentage',
      },
      columnTitles: {
        listPrice: `${t('wholesale.pricelist_price')} (${vatDescription})`,
        regularPrice: `${t('price')} (${vatDescription})`,
      },
      excludeColumns: ['quantityLevels', 'priceMode'],
      columnCellProps: {
        listPrice: {
          onBlur: onPriceBlur,
        },
        discount: {
          onBlur: onDiscountBlur,
        },
        margin: {
          onBlur: onMarginBlur,
        },
      },
    };

    let columns = getColumns(selectedProducts, columnOptions);
    columns = addQuantityLevelsColumn(
      columns,
      onEditQuantityLevels,
      vatDescription,
    );
    columns = addPriceModeColumn(columns);
    addActionsColumn(
      columns,
      {
        onDelete: (entity: SelectorEntity) => onDeleteProduct(entity._id),
      },
      'delete',
    );

    return columns;
  };

  const addQuantityLevelsColumn = (
    columns: ColumnDef<PricelistProductList>[],
    onEdit: (id: string) => void,
    vatDescription: string,
  ): ColumnDef<PricelistProductList>[] => {
    const quantityLevelsColumn: ColumnDef<PricelistProductList> = {
      id: 'quantityLevels',
      enableHiding: false,
      enableSorting: false,
      size: 82,
      maxSize: 82,
      minSize: 82,
      cell: ({ row, table }) => {
        const rowData = row.original;
        return h(PricelistQtyLevelsCell, {
          quantityLevels: rowData.quantityLevels,
          className: getBasicCellStyle(table),
          vatDescription,
          id: rowData._id,
          onEdit,
        });
      },
      header: ({ table }) => {
        return h(
          'div',
          { class: cn(getBasicHeaderStyle(table), 'px-3') },
          t('wholesale.pricelist_qty_levels'),
        );
      },
    };
    return extendColumns(columns, quantityLevelsColumn);
  };

  const addPriceModeColumn = (columns: ColumnDef<PricelistProductList>[]) => {
    const priceModeColumn: ColumnDef<PricelistProductList> = {
      id: 'priceMode',
      enableHiding: false,
      enableSorting: false,
      size: 22,
      maxSize: 22,
      minSize: 22,
      cell: ({ row, table }) => {
        const rowData = row.original;
        return h(PricelistPriceModeCell, {
          priceMode: rowData.priceMode,
          className: getBasicCellStyle(table),
        });
      },
      header: ({ table }) => {
        return h('div', { class: cn(getBasicHeaderStyle(table), 'px-0') }, ' ');
      },
    };
    return extendColumns(columns, priceModeColumn);
  };

  const getPinnedState = () => ({
    left: [],
    right: [
      'listPrice',
      'discount',
      'margin',
      'quantityLevels',
      'priceMode',
      'actions',
    ],
  });

  return {
    setupPricelistColumns,
    addQuantityLevelsColumn,
    getPinnedState,
  };
};
