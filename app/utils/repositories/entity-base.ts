import type { NitroFetchRequest, $Fetch } from 'nitropack';

/**
 * Creates a base repository with common CRUD operations
 *
 * @param entity Base entity for this entity type
 * @param fetch Fetch function to use
 */
export function entityBaseRepo<T extends GeinsEntity>(
  entityEndpoint: string,
  fetch: $Fetch<T, NitroFetchRequest>,
) {
  return {
    async get(id: string): Promise<T> {
      return await fetch<T>(`${entityEndpoint}/${id}`);
    },

    async list(): Promise<T[]> {
      return await fetch<T[]>(`${entityEndpoint}/list`);
    },
  };
}
