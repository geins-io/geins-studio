import type { ColumnDef, Row } from '@tanstack/vue-table';
import type { PricelistProductList } from '#shared/types';
import { PricelistQtyLevelsCell } from '#components';

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
  ) => {
    const columnOptions: ColumnOptions<PricelistProductList> = {
      columnTypes: {
        listPrice: 'editable-currency',
        discount: 'editable-percentage',
        margin: 'editable-percentage',
      },
      columnTitles: {
        listPrice: `${t('wholesale.pricelist_pricelist_price')} (${vatDescription})`,
        regularPrice: `${t('wholesale.pricelist_price')} (${vatDescription})`,
      },
      excludeColumns: ['manual', 'quantityLevels', 'margin', 'discount'],
      columnCellProps: {
        listPrice: {
          onBlur: onPriceBlur,
        },
      },
    };

    let columns = getColumns(selectedProducts, columnOptions);
    columns = addQuantityLevelsColumn(columns, onEditQuantityLevels);
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
  ): ColumnDef<PricelistProductList>[] => {
    const quantityLevelsColumn: ColumnDef<PricelistProductList> = {
      id: 'quantityLevels',
      enableHiding: false,
      enableSorting: false,
      size: 40,
      maxSize: 40,
      minSize: 40,
      cell: ({ row, table }) => {
        const rowData = row.original;
        return h(PricelistQtyLevelsCell, {
          quantityLevels: rowData.quantityLevels,
          className: getBasicCellStyle(table),
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

  const getPinnedState = () => ({
    left: [],
    right: ['listPrice', 'discount', 'margin', 'quantityLevels', 'actions'],
  });

  return {
    setupPricelistColumns,
    addQuantityLevelsColumn,
    getPinnedState,
  };
};
