import type { $Fetch } from 'nitropack';
import { entityBaseRepo } from './entity-base';

export function entityRepo<
  TResponse extends EntityBase,
  TCreate extends object,
  TUpdate extends object,
>(entityEndpoint: string, fetch: $Fetch) {
  const entityBase = entityBaseRepo<TResponse>(entityEndpoint, fetch);

  return {
    ...entityBase,

    async create(data: TCreate): Promise<TResponse> {
      return await fetch<TResponse>(entityEndpoint, {
        method: 'POST',
        body: data,
      });
    },

    async update(id: string, data: TUpdate): Promise<TResponse> {
      // Type assertion only at the API boundary
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },

    async delete(id: string): Promise<void> {
      await fetch<null>(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}
