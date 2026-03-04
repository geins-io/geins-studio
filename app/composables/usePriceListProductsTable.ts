import type { PriceListProductList } from '#shared/types';
import type { ColumnDef, Row } from '@tanstack/vue-table';
import {
  PriceListVolumePricingCell,
  PriceListPriceModeCell,
} from '#components';

interface UsePriceListProductsTableReturnType {
  setupPriceListColumns: (
    selectedProducts: PriceListProductList[],
    vatDescription: string,
    onEditVolumePricing: (payload: { id: string; name: string }) => void,
    onDeleteProduct: (id: string) => void,
    onPriceBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
    onMarginBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
    onDiscountBlur: (
      value: string | number,
      row: Row<PriceListProductList>,
    ) => void,
  ) => ColumnDef<PriceListProductList>[];
  addVolumePricingColumn: (
    columns: ColumnDef<PriceListProductList>[],
    onEdit: (payload: { id: string; name: string }) => void,
    vatDescription: string,
  ) => ColumnDef<PriceListProductList>[];
  getPinnedState: ComputedRef<{
    left: never[];
    right: string[];
  }>;
}

/**
 * Composable for managing price list products table columns and interactions.
 *
 * Provides utilities for setting up table columns with specific behaviors for
 * price list products, including editable pricing fields, volume pricing, and actions.
 *
 * @returns {UsePriceListProductsTableReturnType} - An object containing table setup utilities
 * @property {function} setupPriceListColumns - Creates complete column configuration for price list products
 * @property {function} addVolumePricingColumn - Adds volume pricing column to existing columns
 * @property {ComputedRef} getPinnedState - Computed pinned state based on layout space
 */
export const usePriceListProductsTable =
  (): UsePriceListProductsTableReturnType => {
    const { t } = useI18n();
    const { hasReducedSpace } = useLayout();
    const {
      getBasicCellStyle,
      getBasicHeaderStyle,
      getColumns,
      addActionsColumn,
      extendColumns,
    } = useColumns<PriceListProductList>();

    const setupPriceListColumns = (
      selectedProducts: PriceListProductList[],
      vatDescription: string,
      onEditVolumePricing: (payload: { id: string; name: string }) => void,
      onDeleteProduct: (id: string) => void,
      onPriceBlur: (
        value: string | number,
        row: Row<PriceListProductList>,
      ) => void,
      onMarginBlur: (
        value: string | number,
        row: Row<PriceListProductList>,
      ) => void,
      onDiscountBlur: (
        value: string | number,
        row: Row<PriceListProductList>,
      ) => void,
    ) => {
      const columnOptions: ColumnOptions<PriceListProductList> = {
        columnTypes: {
          listPrice: 'editable-currency',
          discount: 'editable-percentage',
          margin: 'editable-percentage',
        },
        columnTitles: {
          listPrice: `${t('pricing.price_list_price')} (${vatDescription})`,
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
      columns = addVolumePricingColumn(
        columns,
        onEditVolumePricing,
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

    const addVolumePricingColumn = (
      columns: ColumnDef<PriceListProductList>[],
      onEdit: (payload: { id: string; name: string }) => void,
      vatDescription: string,
    ): ColumnDef<PriceListProductList>[] => {
      const volumePricingColumn: ColumnDef<PriceListProductList> = {
        id: 'volumePricing',
        enableHiding: false,
        enableSorting: false,
        size: 89,
        maxSize: 89,
        minSize: 89,
        cell: ({ row, table }) => {
          const rowData = row.original;
          return h(PriceListVolumePricingCell, {
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
            t('pricing.price_list_vol_pricing'),
          );
        },
      };
      return extendColumns(columns, volumePricingColumn);
    };

    const addPriceModeColumn = (columns: ColumnDef<PriceListProductList>[]) => {
      const priceModeColumn: ColumnDef<PriceListProductList> = {
        id: 'priceMode',
        enableHiding: false,
        enableSorting: false,
        size: 22,
        maxSize: 22,
        minSize: 22,
        cell: ({ row, table }) => {
          const rowData = row.original;
          return h(PriceListPriceModeCell, {
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
      setupPriceListColumns,
      addVolumePricingColumn,
      getPinnedState,
    };
  };
