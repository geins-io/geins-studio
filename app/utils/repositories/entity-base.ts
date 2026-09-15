// entity-base.ts
import type { ApiOptions } from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { FetchOptions } from 'ofetch';

/**
 * Extra fetch options a repository call may forward to `$geinsApi` on top of
 * the query/body it builds:
 * - `suppressErrorToast` — per-request opt-out of the global error toast, for a
 *   background fetch or a flow with its own inline error UX.
 * - `headers` — extra request headers merged into the ones `$geinsApi` sets
 *   (auth, account key), e.g. `If-Match: {etag}` for an optimistic-concurrency
 *   update. The factory methods spread these last, so they never clobber the
 *   method/body/query the call builds.
 */
export type RepoFetchOptions = Pick<
  FetchOptions,
  'suppressErrorToast' | 'headers'
>;

/** Return type for {@link entityGetRepo} — single entity retrieval */
export interface EntityGetRepo<
  TResponse,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
> {
  get(
    id: string,
    options?: TOptions,
    fetchOptions?: RepoFetchOptions,
  ): Promise<TResponse>;
}

/** Return type for {@link entityListRepo} — list operations */
export interface EntityListRepo<
  TResponse,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
> {
  list(
    options?: TOptions,
    fetchOptions?: RepoFetchOptions,
  ): Promise<TResponse[]>;
}

/** Return type for {@link entityBaseRepo} — combined get + list (read-only) */
export type EntityBaseRepo<
  TResponse,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
> = EntityGetRepo<TResponse, TOptions> & EntityListRepo<TResponse, TOptions>;

/**
 * Creates a repository with single entity retrieval operations
 */
export function entityGetRepo<
  TResponse extends EntityBase,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  entityEndpoint: string,
  fetch: $Fetch<TResponse, NitroFetchRequest>,
): EntityGetRepo<TResponse, TOptions> {
  return {
    async get(
      id: string,
      options?: TOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, {
        query: buildQueryObject(options),
        ...fetchOptions,
      });
    },
  };
}

/**
 * Creates a repository with list operations
 */
export function entityListRepo<
  TResponse extends EntityBase,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  entityEndpoint: string,
  fetch: $Fetch<TResponse, NitroFetchRequest>,
): EntityListRepo<TResponse, TOptions> {
  return {
    async list(
      options?: TOptions,
      fetchOptions?: RepoFetchOptions,
    ): Promise<TResponse[]> {
      return await fetch<TResponse[]>(`${entityEndpoint}/list`, {
        query: buildQueryObject(options),
        ...fetchOptions,
      });
    },
  };
}

/**
 * Creates a base repository with common read operations (backward compatibility)
 */
export function entityBaseRepo<
  TResponse extends EntityBase,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  entityEndpoint: string,
  fetch: $Fetch<TResponse, NitroFetchRequest>,
): EntityBaseRepo<TResponse, TOptions> {
  return {
    ...entityGetRepo<TResponse, TOptions>(entityEndpoint, fetch),
    ...entityListRepo<TResponse, TOptions>(entityEndpoint, fetch),
  };
}
