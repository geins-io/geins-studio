import type { ColumnDef, Row } from '@tanstack/vue-table';
import type { PricelistProductList } from '#shared/types';
import {
  PricelistVolumePricingCell,
  PricelistPriceModeCell,
} from '#components';

interface UsePricelistProductsTableReturnType {
  setupPricelistColumns: (
    selectedProducts: PricelistProductList[],
    vatDescription: string,
    onEditQuantityLevels: (payload: { id: string; name: string }) => void,
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
  ) => ColumnDef<PricelistProductList>[];
  addQuantityLevelsColumn: (
    columns: ColumnDef<PricelistProductList>[],
    onEdit: (payload: { id: string; name: string }) => void,
    vatDescription: string,
  ) => ColumnDef<PricelistProductList>[];
  getPinnedState: ComputedRef<{
    left: never[];
    right: string[];
  }>;
}

/**
 * Composable for managing pricelist products table columns and interactions.
 *
 * Provides utilities for setting up table columns with specific behaviors for
 * pricelist products, including editable pricing fields, volume pricing, and actions.
 *
 * @returns {UsePricelistProductsTableReturnType} - An object containing table setup utilities
 * @property {function} setupPricelistColumns - Creates complete column configuration for pricelist products
 * @property {function} addQuantityLevelsColumn - Adds volume pricing column to existing columns
 * @property {ComputedRef} getPinnedState - Computed pinned state based on layout space
 */
export const usePricelistProductsTable =
  (): UsePricelistProductsTableReturnType => {
    const { t } = useI18n();
    const { hasReducedSpace } = useLayout();
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
      onEditQuantityLevels: (payload: { id: string; name: string }) => void,
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
        excludeColumns: ['volumePricing', 'priceMode'],
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
      onEdit: (payload: { id: string; name: string }) => void,
      vatDescription: string,
    ): ColumnDef<PricelistProductList>[] => {
      const volumePricingColumn: ColumnDef<PricelistProductList> = {
        id: 'volumePricing',
        enableHiding: false,
        enableSorting: false,
        size: 82,
        maxSize: 82,
        minSize: 82,
        cell: ({ row, table }) => {
          const rowData = row.original;
          return h(PricelistVolumePricingCell, {
            volumePricing: rowData.volumePricing,
            className: getBasicCellStyle(table),
            vatDescription,
            id: rowData._id,
            name: rowData.name,
            onEdit,
          });
        },
        header: ({ table }) => {
          return h(
            'div',
            { class: cn(getBasicHeaderStyle(table), 'px-3 sm:px-3') },
            t('wholesale.pricelist_vol_pricing'),
          );
        },
      };
      return extendColumns(columns, volumePricingColumn);
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
          return h(
            'div',
            { class: cn(getBasicHeaderStyle(table), 'px-0') },
            ' ',
          );
        },
      };
      return extendColumns(columns, priceModeColumn);
    };

    const getPinnedState = computed(() => ({
      left: [],
      right: hasReducedSpace.value
        ? ['priceMode', 'actions']
        : [
            'listPrice',
            'discount',
            'margin',
            'volumePricing',
            'priceMode',
            'actions',
          ],
    }));

    return {
      setupPricelistColumns,
      addQuantityLevelsColumn,
      getPinnedState,
    };
  };
