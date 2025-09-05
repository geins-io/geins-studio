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

    async create(
      data: TCreate,
      query?: Record<string, unknown>,
    ): Promise<TResponse> {
      return await fetch<TResponse>(entityEndpoint, {
        method: 'POST',
        body: data,
        query,
      });
    },

    async update(
      id: string,
      data: TUpdate,
      query?: Record<string, unknown>,
    ): Promise<TResponse> {
      return await fetch<TResponse>(`${entityEndpoint}/${id}`, {
        method: 'PATCH',
        body: data,
        query,
      });
    },

    async delete(id: string): Promise<void> {
      await fetch<null>(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}
