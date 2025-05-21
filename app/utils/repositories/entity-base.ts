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
    async get(id: string): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`);
    },

    async list(): Promise<TResponse[]> {
      return await fetch<TResponse[]>(`${entityEndpoint}/list`);
    },
  };
}
