import type {
  ApiOptions,
  GeinsErrorAction,
  GeinsErrorContext,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { EntityKey } from '#shared/utils/entities';
import { entityBaseRepo } from './entity-base';
import type { EntityBaseRepo } from './entity-base';
import type { $Fetch } from 'nitropack';

/**
 * Input to {@link entityRepo}: an endpoint plus an optional i18n entity key.
 *
 * A registry entry (`ENTITIES.x`) satisfies this directly — that is the normal
 * call: `repo.entity(ENTITIES.price_list, fetch)`. For a scoped/custom endpoint
 * that isn't in the registry (e.g. a company-scoped buyer), pass an inline
 * `{ endpoint, key }`. Omit `key` for endpoints with no localized name (no
 * specific error toast).
 */
export type EntityRepoTarget = { endpoint: string; key?: EntityKey };

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
 * Creates a full CRUD repository for an entity.
 *
 * Extends {@link entityBaseRepo} (get + list) with create, update, and delete.
 * This is the standard factory for entities that need write operations.
 *
 * Takes a {@link EntityRepoTarget} (endpoint + optional i18n key). Pass a
 * registry entry directly for domain entities — `repo.entity(ENTITIES.x, fetch)`
 * — so the endpoint and the toast key both come from the single source. When a
 * `key` is present, create/update/delete attach `errorContext` so the global
 * error toast shows a specific "Something went wrong while {action} {entity}"
 * message instead of the generic fallback.
 *
 * @template TResponse - API response type (must extend EntityBase)
 * @template TCreate - Creation payload type
 * @template TUpdate - Update payload type
 * @template TOptions - Query options type for field selection
 *
 * @param target - Registry entry (`ENTITIES.x`) or `{ endpoint, key? }`
 * @param fetch - Authenticated $fetch instance ($geinsApi)
 * @returns Object with get, list, create, update, delete methods
 *
 * @example
 * ```ts
 * // registry entity (normal case)
 * const priceListRepo = entityRepo<ProductPriceList, ...>(ENTITIES.price_list, $geinsApi);
 * // scoped/custom endpoint not in the registry
 * const buyerRepo = entityRepo<CompanyBuyer, ...>({ endpoint, key: 'buyer' }, $geinsApi);
 * ```
 */
export function entityRepo<
  TResponse extends EntityBase,
  TCreate extends object,
  TUpdate extends object,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  target: EntityRepoTarget,
  fetch: $Fetch,
): EntityRepo<TResponse, TCreate, TUpdate, TOptions> {
  const { endpoint: entityEndpoint, key: entityKey } = target;
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
