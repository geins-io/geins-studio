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
  QuotationPreviewRequest,
  QuotationPreviewResponse,
  QuotationMessageCreate,
  QuotationMessageUpdate,
  StatusTransitionRequest,
  ExtendTransitionRequest,
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
        return await this.query(batchQuery, options);
      },

      /**
       * Ping endpoint to check quotation service availability
       */
      async ping(): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/ping`);
      },

      // Status transition methods — all return void; caller must re-fetch.
      async send(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/send`, {
          method: 'POST',
          body: data,
        });
      },
      async accept(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/accept`, {
          method: 'POST',
          body: data,
        });
      },
      async reject(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/reject`, {
          method: 'POST',
          body: data,
        });
      },
      async confirm(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/confirm`, {
          method: 'POST',
          body: data,
        });
      },
      async expire(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/expire`, {
          method: 'POST',
          body: data,
        });
      },
      async cancel(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/cancel`, {
          method: 'POST',
          body: data,
        });
      },
      async finalize(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/finalize`, {
          method: 'POST',
          body: data,
        });
      },
      async extend(id: string, data: ExtendTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/extend`, {
          method: 'POST',
          body: data,
        });
      },
      async copy(id: string): Promise<Quotation> {
        return await fetch<Quotation>(`${QUOTATION_ENDPOINT}/${id}/copy`, {
          method: 'POST',
        });
      },
      async preview(
        id: string,
        data: QuotationPreviewRequest,
      ): Promise<QuotationPreviewResponse> {
        return await fetch<QuotationPreviewResponse>(
          `${QUOTATION_ENDPOINT}/${id}/preview`,
          {
            method: 'POST',
            body: data,
          },
        );
      },

      // Message CRUD — all return void; caller must re-fetch.
      async createMessage(
        quotationId: string,
        data: QuotationMessageCreate,
      ): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${quotationId}/message`, {
          method: 'POST',
          body: data,
        });
      },
      async updateMessage(
        messageId: string,
        data: QuotationMessageUpdate,
      ): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/message/${messageId}`, {
          method: 'PATCH',
          body: data,
        });
      },
      async deleteMessage(messageId: string): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/message/${messageId}`, {
          method: 'DELETE',
        });
      },
    },
  };
}
