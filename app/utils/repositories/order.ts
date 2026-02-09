import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  Order,
  OrderBatchQuery,
  BatchQueryResult,
  Quotation,
  QuotationList,
  QuotationBatchQuery,
  QuotationBatchQueryResult,
  QuotationApiOptions,
} from '#shared/types';
import { entityGetRepo } from './entity-base';
import { buildQueryObject } from '#shared/utils/api-query';

const BASE_ENDPOINT = '/order';
const QUOTATION_ENDPOINT = '/quotation';

/**
 * Transform API quotation response to list view format with computed display fields
 */
function transformQuotationToList(quotation: Quotation): QuotationList {
  const itemCount = quotation.items?.length || 0;
  const sum = {
    price: quotation.total.subtotal.toString(),
    currency: quotation.currency,
  };

  return {
    ...quotation,
    accountName: quotation.company?.name || '',
    itemCount,
    sum,
    expirationDate: quotation.validTo || '',
    createdBy: quotation.owner?.name || '',
    dateCreated: quotation.validFrom,
    dateModified: quotation.validFrom,
  };
}

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
     * Quotation repository using real API endpoints
     */
    quotation: {
      /**
       * Query quotations with batch filtering
       * Returns all quotations by default
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

      /**
       * List all quotations (convenience method)
       * Returns items from first page of query
       */
      async list(options?: QuotationApiOptions): Promise<QuotationList[]> {
        const result = await fetch<QuotationBatchQueryResult>(
          `${QUOTATION_ENDPOINT}/query`,
          {
            method: 'POST',
            body: { all: true, pageSize: 1000 },
            query: buildQueryObject({
              ...options,
              fields: options?.fields || ['default'],
            }),
          },
        );
        return result.items.map(transformQuotationToList);
      },

      /**
       * Get single quotation by ID
       */
      async get(
        quotationId: string,
        options?: QuotationApiOptions,
      ): Promise<Quotation> {
        const result = await fetch<QuotationBatchQueryResult>(
          `${QUOTATION_ENDPOINT}/query`,
          {
            method: 'POST',
            body: {
              include: [
                {
                  condition: 'or' as const,
                  selections: [{ quotationIds: [quotationId] }],
                },
              ],
            },
            query: buildQueryObject(options),
          },
        );
        if (!result.items || result.items.length === 0) {
          throw new Error(`Quotation with ID ${quotationId} not found`);
        }
        return result.items[0]!;
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
