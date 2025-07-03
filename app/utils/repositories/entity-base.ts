// entity-base.ts
import type { NitroFetchRequest, $Fetch } from 'nitropack';

/**
 * Creates a base repository with common read operations
 */
export function entityBaseRepo<TResponse extends EntityBase>(
  entityEndpoint: string,
  fetch: $Fetch<TResponse, NitroFetchRequest>,
) {
  return {
    async get(id: string, query?: Record<string, unknown>): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, { query });
    },

    async list(query?: Record<string, unknown>): Promise<TResponse[]> {
      return await fetch<TResponse[]>(`${entityEndpoint}/list`, { query });
    },
  };
}
