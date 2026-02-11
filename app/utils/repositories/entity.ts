import type { ApiOptions } from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { EntityBaseRepo } from './entity-base';
import { entityBaseRepo } from './entity-base';
import type { $Fetch } from 'nitropack';

/** Return type for {@link entityRepo} — full CRUD (get + list + create + update + delete) */
export interface EntityRepo<
  TResponse,
  TCreate extends object,
  TUpdate extends object,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
> extends EntityBaseRepo<TResponse, TOptions> {
  create(data: TCreate, options?: TOptions): Promise<TResponse>;
  update(id: string, data: TUpdate, options?: TOptions): Promise<TResponse>;
  delete(id: string): Promise<void>;
}

/**
 * Creates a full CRUD repository for an entity endpoint.
 *
 * Extends {@link entityBaseRepo} (get + list) with create, update, and delete.
 * This is the standard factory for entities that need write operations.
 *
 * @template TResponse - API response type (must extend EntityBase)
 * @template TCreate - Creation payload type
 * @template TUpdate - Update payload type
 * @template TOptions - Query options type for field selection
 *
 * @param entityEndpoint - API path (e.g., '/product/pricelist')
 * @param fetch - Authenticated $fetch instance ($geinsApi)
 * @returns Object with get, list, create, update, delete methods
 *
 * @example
 * ```ts
 * const priceListRepo = entityRepo<PriceListResponse, PriceListCreate, PriceListUpdate>(
 *   '/product/pricelist',
 *   $geinsApi,
 * );
 * const item = await priceListRepo.get('123');
 * await priceListRepo.create({ name: 'New List' });
 * ```
 */
export function entityRepo<
  TResponse extends EntityBase,
  TCreate extends object,
  TUpdate extends object,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  entityEndpoint: string,
  fetch: $Fetch,
): EntityRepo<TResponse, TCreate, TUpdate, TOptions> {
  const entityBase = entityBaseRepo<TResponse, TOptions>(entityEndpoint, fetch);

  return {
    ...entityBase,

    async create(data: TCreate, options?: TOptions): Promise<TResponse> {
      return await fetch<TResponse>(entityEndpoint, {
        method: 'POST',
        body: data,
        query: buildQueryObject(options),
      });
    },

    async update(
      id: string,
      data: TUpdate,
      options?: TOptions,
    ): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, {
        method: 'PATCH',
        body: data,
        query: buildQueryObject(options),
      });
    },

    async delete(id: string): Promise<void> {
      await fetch<null>(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}
