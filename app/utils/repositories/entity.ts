import type { NitroFetchRequest, $Fetch } from 'nitropack';

/**
 * Creates a base repository with common CRUD operations
 *
 * @param entity Base entity for this entity type
 * @param fetch Fetch function to use
 */
export function entityRepo<T extends GeinsEntity, InputT extends GeinsEntity>(
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

    async create(data: InputT): Promise<T> {
      return await fetch<T>(entityEndpoint, {
        method: 'POST',
        body: data,
      });
    },

    async update(data: InputT): Promise<T> {
      const id = data._id;
      return await fetch<T>(`${entityEndpoint}/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },

    async delete(id: string): Promise<void> {
      return await fetch(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}
