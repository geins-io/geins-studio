import type { Order, OrderBatchQuery } from '#shared/types';
import { SelectorCondition } from '#shared/types';

interface UseDashboardCompanyOrdersReturnType {
  orders: ComputedRef<Order[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<boolean>;
  refresh: () => Promise<void>;
}

const WHOLESALE_ORDERS: OrderBatchQuery = {
  include: [
    {
      selections: [
        { condition: SelectorCondition.And, orderTypes: ['wholesale'] },
      ],
    },
  ],
};

/**
 * Every wholesale order, newest first, fetched once for all the start
 * dashboard's widgets: Latest company orders and Company sales share the
 * `useAsyncData` key, so the board makes one request (and one Retry). The
 * order query has no date filter, so widgets narrow the list themselves and
 * a filter change sends no request.
 *
 * @returns {UseDashboardCompanyOrdersReturnType} - The orders and the fetch state
 * @property {ComputedRef<Order[]>} orders - All wholesale orders, newest first
 * @property {ComputedRef<boolean>} loading - Whether the orders are being fetched
 * @property {ComputedRef<boolean>} error - Whether the fetch failed
 * @property {function} refresh - Fetches the orders again
 */
export const useDashboardCompanyOrders =
  (): UseDashboardCompanyOrdersReturnType => {
    const { orderApi } = useGeinsRepository();
    const { batchQueryNoPagination } = useBatchQuery();

    // The widgets show a failed fetch themselves, so no global error toast
    const { data, status, refresh } = useAsyncData(
      'dashboard-company-orders',
      async () => {
        const result = await orderApi.query(
          { ...WHOLESALE_ORDERS, ...batchQueryNoPagination.value },
          undefined,
          { suppressErrorToast: true },
        );
        const orders = Array.isArray(result?.items) ? result.items : [];
        return [...orders].sort(
          (a, b) =>
            new Date(b.dateCreated).getTime() -
            new Date(a.dateCreated).getTime(),
        );
      },
      // A widget set up while another's fetch is in flight joins it; the
      // default ('cancel') would abort it and send the request again
      { dedupe: 'defer' },
    );

    return {
      orders: computed(() => data.value ?? []),
      loading: computed(() => status.value === 'pending'),
      error: computed(() => status.value === 'error'),
      refresh,
    };
  };
