// entity-base.ts
import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { ApiOptions } from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';

/**
 * Creates a repository with single entity retrieval operations
 */
export function entityGetRepo<
  TResponse extends EntityBase,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(entityEndpoint: string, fetch: $Fetch<TResponse, NitroFetchRequest>) {
  return {
    async get(id: string, options?: TOptions): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, {
        query: buildQueryObject(options),
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
>(entityEndpoint: string, fetch: $Fetch<TResponse, NitroFetchRequest>) {
  return {
    async list(options?: TOptions): Promise<TResponse[]> {
      return await fetch<TResponse[]>(`${entityEndpoint}/list`, {
        query: buildQueryObject(options),
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
>(entityEndpoint: string, fetch: $Fetch<TResponse, NitroFetchRequest>) {
  return {
    ...entityGetRepo<TResponse, TOptions>(entityEndpoint, fetch),
    ...entityListRepo<TResponse, TOptions>(entityEndpoint, fetch),
  };
}
