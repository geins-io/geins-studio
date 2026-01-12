import type {
  CustomerOrder,
  Order,
  ColumnOptions,
  OrderBatchQuery,
  BatchQueryResult,
  CustomerPriceList,
  CustomerCompany,
  CustomerBuyer,
} from '#shared/types';
import type { ColumnDef } from '@tanstack/vue-table';

interface UseCompanyOrdersReturnType {
  ordersList: Ref<CustomerOrder[]>;
  orderColumns: ComputedRef<ColumnDef<CustomerOrder>[]>;
  columnOptionsOrders: ColumnOptions<CustomerOrder>;
  fetchOrders: (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
    allBuyers?: CustomerBuyer[],
  ) => Promise<void>;
  transformOrdersForList: (
    orders: Order[],
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
    allBuyers?: CustomerBuyer[],
  ) => CustomerOrder[];
  getBuyerNameByEmail: (email: string, allBuyers: CustomerBuyer[]) => string;
}

/**
 * Composable for managing company orders data and table display.
 *
 * Provides utilities for fetching, transforming, and displaying company orders
 * with proper formatting, column configuration, and reactive state management.
 *
 * @returns {UseCompanyOrdersReturnType} - An object containing company orders state and utilities
 * @property {Ref<CustomerOrder[]>} ordersList - Reactive list of customer orders
 * @property {ComputedRef} orderColumns - Computed column definitions for orders table
 * @property {object} columnOptionsOrders - Column configuration options for orders
 * @property {function} fetchOrders - Fetches orders from API with filtering and transformation
 * @property {function} transformOrdersForList - Transforms API orders to display format
 * @property {function} getBuyerNameByEmail - Gets buyer display name by email or returns email if not found
 */
export const useCompanyOrders = (): UseCompanyOrdersReturnType => {
  const { orderApi } = useGeinsRepository();
  const { t } = useI18n();
  const accountStore = useAccountStore();
  const { convertToPrice } = usePrice();
  const { getColumns: getOrderColumns } = useColumns<CustomerOrder>();
  const { batchQueryNoPagination } = useBatchQuery();
  const { geinsLogError } = useGeinsLog('composables/useCompanyOrders.ts');

  // Reactive state
  const ordersList = ref<CustomerOrder[]>([]);

  // Column configuration for orders table
  const columnOptionsOrders: ColumnOptions<CustomerOrder> = {
    columnTitles: {
      sumIncVat: 'Sum (inc vat)',
      sumExVat: 'Sum (ex vat)',
      priceLists: t('price_list', 2),
    },
    columnTypes: {
      sumIncVat: 'currency',
      sumExVat: 'currency',
      created: 'date',
      priceLists: 'tooltip',
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
    allBuyers: CustomerBuyer[],
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
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
    allBuyers?: CustomerBuyer[],
  ): CustomerOrder[] => {
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
      ...(allPriceLists && {
        priceLists: createTooltip({
          items: order.priceLists,
          entityName: 'price_list',
          formatter: (group) =>
            `${getEntityNameById(group._id, allPriceLists)}`,
          t,
        }),
      }),
      ...(allCompanies && {
        customerCompany: getEntityNameById(
          order.wholesaleAccountId,
          allCompanies,
        ),
      }),
      status: order.status,
    }));
  };

  // Fetch orders for a specific customer company
  const fetchOrders = async (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
    allBuyers?: CustomerBuyer[],
  ): Promise<void> => {
    try {
      const ordersData = ref<BatchQueryResult<Order> | null>(null);

      ordersData.value = await orderApi.query(
        { ...orderSelectionQuery, ...batchQueryNoPagination.value },
        orderApiOptions,
      );

      if (ordersData.value) {
        ordersList.value = transformOrdersForList(
          ordersData.value.items,
          allPriceLists,
          allCompanies,
          allBuyers,
        );
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
