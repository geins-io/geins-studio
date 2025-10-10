import type {
  WholesaleOrder,
  Order,
  ColumnOptions,
  OrderBatchQuery,
  BatchQueryResult,
  WholesalePricelist,
  WholesaleAccount,
  WholesaleBuyer,
} from '#shared/types';
import type { ColumnDef } from '@tanstack/vue-table';

interface UseWholesaleOrdersReturnType {
  ordersList: Ref<WholesaleOrder[]>;
  orderColumns: ComputedRef<ColumnDef<WholesaleOrder>[]>;
  columnOptionsOrders: ColumnOptions<WholesaleOrder>;
  fetchOrders: (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    accountId?: string,
    allPricelists?: WholesalePricelist[],
    allAccounts?: WholesaleAccount[],
    allBuyers?: WholesaleBuyer[],
  ) => Promise<void>;
  transformOrdersForList: (
    orders: Order[],
    allPricelists?: WholesalePricelist[],
    allAccounts?: WholesaleAccount[],
    allBuyers?: WholesaleBuyer[],
  ) => WholesaleOrder[];
  getBuyerNameByEmail: (email: string, allBuyers: WholesaleBuyer[]) => string;
}

/**
 * Composable for managing wholesale orders data and table display.
 *
 * Provides utilities for fetching, transforming, and displaying wholesale orders
 * with proper formatting, column configuration, and reactive state management.
 *
 * @returns {UseWholesaleOrdersReturnType} - An object containing wholesale orders state and utilities
 * @property {Ref<WholesaleOrder[]>} ordersList - Reactive list of wholesale orders
 * @property {ComputedRef} orderColumns - Computed column definitions for orders table
 * @property {object} columnOptionsOrders - Column configuration options for orders
 * @property {function} fetchOrders - Fetches orders from API with filtering and transformation
 * @property {function} transformOrdersForList - Transforms API orders to display format
 * @property {function} getBuyerNameByEmail - Gets buyer display name by email or returns email if not found
 */
export const useWholesaleOrders = (): UseWholesaleOrdersReturnType => {
  const { orderApi } = useGeinsRepository();
  const { t } = useI18n();
  const accountStore = useAccountStore();
  const { convertToPrice } = usePrice();
  const { getColumns: getOrderColumns } = useColumns<WholesaleOrder>();
  const { batchQueryNoPagination } = useBatchQuery();
  const { geinsLogError } = useGeinsLog('composables/useWholesaleOrders.ts');

  // Reactive state
  const ordersList = ref<WholesaleOrder[]>([]);

  // Column configuration for orders table
  const columnOptionsOrders: ColumnOptions<WholesaleOrder> = {
    columnTitles: {
      sumIncVat: 'Sum (inc vat)',
      sumExVat: 'Sum (ex vat)',
      pricelists: t('pricelist', 2),
    },
    columnTypes: {
      sumIncVat: 'currency',
      sumExVat: 'currency',
      created: 'date',
      pricelists: 'tooltip',
      buyer: 'tooltip',
    },
  };

  // Computed for reactive columns
  const orderColumns = computed(() => {
    if (ordersList.value.length === 0) return [];
    const columns = getOrderColumns(ordersList.value, columnOptionsOrders);
    return columns;
  });

  const getBuyerNameByEmail = (
    email: string,
    allBuyers: WholesaleBuyer[],
  ): string => {
    const buyer = allBuyers.find((b) => b._id === email);
    if (buyer) {
      return `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim();
    }
    return email;
  };

  // Transform orders from API format to display format
  const transformOrdersForList = (
    orders: Order[],
    allPricelists?: WholesalePricelist[],
    allAccounts?: WholesaleAccount[],
    allBuyers?: WholesaleBuyer[],
  ): WholesaleOrder[] => {
    return orders.map((order) => ({
      _id: order._id,
      created: order.dateCreated,
      channel: accountStore.getChannelNameById(order.channel),
      ...(allBuyers && {
        buyer: {
          displayValue: getBuyerNameByEmail(order.email, allBuyers),
          contentValue: order.email,
          disabled: getBuyerNameByEmail(order.email, allBuyers) === order.email,
        },
      }),
      ...(order.itemCount && { items: order.itemCount }),
      sumIncVat: convertToPrice(order.sumIncVat, order.currency),
      sumExVat: convertToPrice(order.sumExVat, order.currency),
      ...(allPricelists && {
        pricelists: createTooltip({
          items: order.priceLists,
          entityName: 'pricelist',
          formatter: (group) =>
            `${getEntityNameById(group._id, allPricelists)}`,
          t,
        }),
      }),
      ...(allAccounts && {
        wholesaleAccount: getEntityNameById(
          order.wholesaleAccountId,
          allAccounts,
        ),
      }),
      status: order.status,
    }));
  };

  // Fetch orders for a specific wholesale account
  const fetchOrders = async (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    accountId: string = '0',
    allPricelists?: WholesalePricelist[],
    allAccounts?: WholesaleAccount[],
    allBuyers?: WholesaleBuyer[],
  ): Promise<void> => {
    try {
      const { data: ordersData, error: ordersError } = await useAsyncData<
        BatchQueryResult<Order>
      >(`orders-${accountId}`, () =>
        orderApi.query(
          { ...orderSelectionQuery, ...batchQueryNoPagination.value },
          orderApiOptions,
        ),
      );

      if (!ordersError.value && ordersData.value) {
        ordersList.value = transformOrdersForList(
          ordersData.value.items,
          allPricelists,
          allAccounts,
          allBuyers,
        );
      } else if (ordersError.value) {
        geinsLogError('error fetching orders', ordersError.value);
        ordersList.value = [];
      }
    } catch (error) {
      geinsLogError('failed to fetch orders', error);
      ordersList.value = [];
    }
  };

  return {
    // State
    ordersList,
    orderColumns,
    columnOptionsOrders,

    // Methods
    getBuyerNameByEmail,
    fetchOrders,
    transformOrdersForList,
  };
};
