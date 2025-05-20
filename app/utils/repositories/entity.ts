import type { NitroFetchRequest, $Fetch } from 'nitropack';

/**
 * Creates a base repository with common CRUD operations
 *
 * @param entity Base entity for this entity type
 * @param fetch Fetch function to use
 */
export function entityRepo<
  T extends GeinsEntity,
  InputT extends GeinsEntityInput,
>(entityEndpoint: string, fetch: $Fetch<T, NitroFetchRequest>) {
  const entityBase = repo.entityBase<T>(entityEndpoint, fetch);

  return {
    ...entityBase,

    async create(data: InputT): Promise<T> {
      return await fetch<T>(entityEndpoint, {
        method: 'POST',
        body: data,
      });
    },

    async update(id: string, data: InputT): Promise<T> {
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
