import type {
  WholesaleOrder,
  Order,
  ColumnOptions,
  OrderBatchQuery,
  BatchQueryResult,
  WholesalePricelist,
  WholesaleAccount,
} from '#shared/types';

export const useWholesaleOrders = () => {
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
    },
  };

  // Computed for reactive columns
  const orderColumns = computed(() => {
    if (ordersList.value.length === 0) return [];
    const columns = getOrderColumns(ordersList.value, columnOptionsOrders);
    return columns;
  });

  // Helper function to get pricelist name by ID
  const getNameById = (
    id: string,
    all: WholesalePricelist[] | WholesaleAccount[],
  ) => {
    const entity = all.find((pl) => pl._id === id);
    return entity ? entity.name : id;
  };

  // Transform orders from API format to display format
  const transformOrdersForList = (
    orders: Order[],
    allPricelists?: WholesalePricelist[],
    allAccounts?: WholesaleAccount[],
  ): WholesaleOrder[] => {
    return orders.map((order) => ({
      _id: order._id,
      created: order.dateCreated,
      channel: accountStore.getChannelNameById(order.channel),
      buyer: order.customerId || order.email || 'N/A',
      ...(order.itemCount && { items: order.itemCount }),
      sumIncVat: convertToPrice(order.sumIncVat, order.currency),
      sumExVat: convertToPrice(order.sumExVat, order.currency),
      ...(allPricelists && {
        pricelists: createTooltip({
          items: order.priceLists,
          entityName: 'pricelist',
          formatter: (group) => `${getNameById(group._id, allPricelists)}`,
          t,
        }),
      }),
      ...(allAccounts && {
        wholesaleAccount: getNameById(order.wholesaleAccountId, allAccounts),
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

  // Clear orders list
  const clearOrders = () => {
    ordersList.value = [];
  };

  return {
    // State
    ordersList,
    orderColumns,
    columnOptionsOrders,

    // Methods
    fetchOrders,
    transformOrdersForList,
    clearOrders,
  };
};
