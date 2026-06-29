import type {
  ApiOptions,
  GeinsErrorAction,
  GeinsErrorContext,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { EntityKey, EntityWithEndpoint } from '#shared/utils/entities';
import { entityBaseRepo } from './entity-base';
import type { EntityBaseRepo } from './entity-base';
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
 * @param entityKey - Optional i18n entity key (e.g. 'price_list'). When set,
 *   create/update/delete attach `errorContext` so the global error toast shows
 *   a specific "Something went wrong while {action} {entity}" message instead
 *   of the generic fallback. Omit for entities without a localized name.
 * @returns Object with get, list, create, update, delete methods
 *
 * @example
 * ```ts
 * const priceListRepo = entityRepo<PriceListResponse, PriceListCreate, PriceListUpdate>(
 *   '/product/pricelist',
 *   $geinsApi,
 *   'price_list',
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
  entityKey?: EntityKey,
): EntityRepo<TResponse, TCreate, TUpdate, TOptions> {
  const entityBase = entityBaseRepo<TResponse, TOptions>(entityEndpoint, fetch);

  // Build the per-action errorContext consumed by the global toast. Returns
  // undefined when no entityKey was supplied, so the call falls back to the
  // generic error message.
  const errorContext = (
    action: GeinsErrorAction,
  ): GeinsErrorContext | undefined =>
    entityKey ? { action, entity: entityKey } : undefined;

  return {
    ...entityBase,

    async create(data: TCreate, options?: TOptions): Promise<TResponse> {
      return await fetch<TResponse>(entityEndpoint, {
        method: 'POST',
        body: data,
        query: buildQueryObject(options),
        errorContext: errorContext('creating'),
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
        errorContext: errorContext('updating'),
      });
    },

    async delete(id: string): Promise<void> {
      await fetch<null>(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
        errorContext: errorContext('deleting'),
      });
    },
  };
}

/**
 * Registry-aware shorthand for {@link entityRepo}: takes a registry entry and
 * reads its `endpoint` + `key` directly, so a domain repo declares the entity
 * once (`ENTITIES.price_list`) instead of hand-passing endpoint + key. The key
 * doubles as the i18n entity key (wired into the global error toast).
 *
 * The param is {@link EntityWithEndpoint} — only entries that actually have a
 * repo endpoint — so passing a singleton like `ENTITIES.profile` is a compile
 * error.
 *
 * @example
 * ```ts
 * // equivalent to entityRepo('/product/pricelist', fetch, 'price_list')
 * const priceListRepo = entityRepoFor<PriceList, PriceListCreate, PriceListUpdate>(
 *   ENTITIES.price_list,
 *   $geinsApi,
 * );
 * ```
 */
export function entityRepoFor<
  TResponse extends EntityBase,
  TCreate extends object,
  TUpdate extends object,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  entity: EntityWithEndpoint,
  fetch: $Fetch,
): EntityRepo<TResponse, TCreate, TUpdate, TOptions> {
  return entityRepo<TResponse, TCreate, TUpdate, TOptions>(
    entity.endpoint,
    fetch,
    entity.key,
  );
}
