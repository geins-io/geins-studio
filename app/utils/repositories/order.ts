import type {
  Order,
  OrderBatchQuery,
  BatchQueryResult,
  Quotation,
  QuotationCreate,
  QuotationUpdate,
  QuotationBatchQuery,
  QuotationBatchQueryResult,
  QuotationApiOptions,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import { entityGetRepo } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/order';
const QUOTATION_ENDPOINT = '/quotation';

/**
 * Repository for managing order operations
 */
export function orderRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const orderEndpoint = BASE_ENDPOINT;

  // Use entityGetRepo as base for single order retrieval
  const baseRepo = entityGetRepo<Order, OrderApiOptions>(orderEndpoint, fetch);

  // Standard CRUD for quotations
  const quotationRepo = repo.entity<
    Quotation,
    QuotationCreate,
    QuotationUpdate,
    QuotationApiOptions
  >(QUOTATION_ENDPOINT, fetch);

  return {
    ...baseRepo,

    /**
     * Query orders with batch filtering
     */
    async query(
      batchQuery: OrderBatchQuery,
      options?: OrderApiOptions,
    ): Promise<BatchQueryResult<Order>> {
      return await fetch<BatchQueryResult<Order>>(`${orderEndpoint}/query`, {
        method: 'POST',
        body: batchQuery,
        query: buildQueryObject(options),
      });
    },

    /**
     * Ping endpoint to check service availability
     */
    async ping(): Promise<void> {
      await fetch<null>(`${orderEndpoint}/ping`);
    },

    /**
     * Quotation repository — standard CRUD via repo.entity,
     * plus custom query and ping endpoints.
     */
    quotation: {
      ...quotationRepo,

      /**
       * Query quotations with batch filtering
       */
      async query(
        batchQuery: QuotationBatchQuery = { all: true },
        options?: QuotationApiOptions,
      ): Promise<QuotationBatchQueryResult> {
        return await fetch<QuotationBatchQueryResult>(
          `${QUOTATION_ENDPOINT}/query`,
          {
            method: 'POST',
            body: batchQuery,
            query: buildQueryObject(options),
          },
        );
      },

      async list(
        batchQuery: QuotationBatchQuery = { all: true },
        options?: QuotationApiOptions,
      ): Promise<QuotationBatchQueryResult> {
        return await fetch<QuotationBatchQueryResult>(
          `${QUOTATION_ENDPOINT}/query`,
          {
            method: 'POST',
            body: batchQuery,
            query: buildQueryObject(options),
          },
        );
      },

      /**
       * Ping endpoint to check quotation service availability
       */
      async ping(): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/ping`);
      },
    },
  };
}
