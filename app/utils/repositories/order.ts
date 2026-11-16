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
import { SelectorCondition } from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import { ENTITIES } from '#shared/utils/entities';
import { entityGetRepo } from './entity-base';
import type { RepoFetchOptions } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/order';
const QUOTATION_ENDPOINT = ENTITIES.quotation.endpoint;

// Request drafts belong to the buyer until submitted, and a revised version is
// replaced by a later one (a chain lists once, as its live version), so Studio
// never shows either. The API ignores `exclude` next to `all: true` and only
// subtracts it from an `include`, so the include is a match-all on
// hasExternalReference. Excluding, rather than listing allowed statuses, keeps
// statuses the API adds later visible.
const VISIBLE_QUOTATIONS_QUERY: QuotationBatchQuery = {
  include: [
    {
      condition: SelectorCondition.Or,
      selections: [
        { hasExternalReference: true },
        { hasExternalReference: false },
      ],
    },
  ],
  exclude: [{ selections: [{ statuses: ['requestDraft', 'revised'] }] }],
};

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
  >(ENTITIES.quotation, fetch);

  return {
    ...baseRepo,

    /**
     * Query orders with batch filtering
     */
    async query(
      batchQuery: OrderBatchQuery,
      options?: OrderApiOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<BatchQueryResult<Order>> {
      return await fetch<BatchQueryResult<Order>>(`${orderEndpoint}/query`, {
        method: 'POST',
        body: batchQuery,
        query: buildQueryObject(options),
        ...fetchOptions,
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

      /**
       * Every quotation Studio may show — request drafts and revised versions excluded
       */
      async list(
        batchQuery: QuotationBatchQuery = VISIBLE_QUOTATIONS_QUERY,
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
          errorContext: { action: 'sending', entity: 'quotation' },
        });
      },
      async accept(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/accept`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async reject(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/reject`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async confirm(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/confirm`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async expire(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/expire`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async cancel(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/cancel`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async finalize(id: string, data: StatusTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/finalize`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async extend(id: string, data: ExtendTransitionRequest): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/extend`, {
          method: 'POST',
          body: data,
          errorContext: { action: 'updating', entity: 'quotation' },
        });
      },
      async copy(id: string): Promise<Quotation> {
        return await fetch<Quotation>(`${QUOTATION_ENDPOINT}/${id}/copy`, {
          method: 'POST',
          errorContext: { action: 'copying', entity: 'quotation' },
        });
      },
      /**
       * The next version of a requested, pending or expired quotation, as a
       * draft linked through `revisionOf`. Sending it moves the source to `revised`.
       */
      async revise(
        id: string,
        fetchOptions?: RepoFetchOptions,
      ): Promise<Quotation> {
        return await fetch<Quotation>(`${QUOTATION_ENDPOINT}/${id}/revision`, {
          method: 'POST',
          errorContext: { action: 'revising', entity: 'quotation' },
          ...fetchOptions,
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
          errorContext: { action: 'creating', entity: 'message' },
        });
      },
      async updateMessage(
        messageId: string,
        data: QuotationMessageUpdate,
      ): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/message/${messageId}`, {
          method: 'PATCH',
          body: data,
          errorContext: { action: 'updating', entity: 'message' },
        });
      },
      async deleteMessage(messageId: string): Promise<void> {
        await fetch<null>(`${QUOTATION_ENDPOINT}/message/${messageId}`, {
          method: 'DELETE',
          errorContext: { action: 'deleting', entity: 'message' },
        });
      },
    },
  };
}
