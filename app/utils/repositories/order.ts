import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  Order,
  OrderCreate,
  OrderUpdate,
  OrderBatchQuery,
  OrderFieldsFilter,
  BatchQueryResult,
  ApiOptions,
} from '#shared/types';
import { entityGetRepo } from './entity-base';
import { buildQuery } from '../api-query';

const BASE_ENDPOINT = '/order';

/**
 * Repository for managing order operations
 */
export function orderRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const orderEndpoint = BASE_ENDPOINT;

  // Use entityGetRepo as base for single order retrieval
  const baseRepo = entityGetRepo<Order, OrderApiOptions>(orderEndpoint, fetch);

  return {
    ...baseRepo,

    /**
     * Query orders with batch filtering
     */
    async query(
      batchQuery: OrderBatchQuery,
      options?: OrderApiOptions,
    ): Promise<BatchQueryResult<Order>> {
      const query = buildQuery(options);
      return await fetch<BatchQueryResult<Order>>(
        `${orderEndpoint}/query${query}`,
        {
          method: 'POST',
          body: batchQuery,
        },
      );
    },

    /**
     * Ping endpoint to check service availability
     */
    async ping(): Promise<void> {
      await fetch<null>(`${orderEndpoint}/ping`);
    },
  };
}
