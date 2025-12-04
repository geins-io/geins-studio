import type { $Fetch } from 'nitropack';
import type { ApiOptions } from '#shared/types';
import { entityBaseRepo } from './entity-base';
import { buildQueryObject } from '#shared/utils/api-query';

export function entityRepo<
  TResponse extends EntityBase,
  TCreate extends object,
  TUpdate extends object,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(entityEndpoint: string, fetch: $Fetch) {
  const entityBase = entityBaseRepo<TResponse, TOptions>(entityEndpoint, fetch);

  return {
    ...entityBase,

    async create(data: TCreate, options?: TOptions): Promise<TResponse> {
      return await fetch<TResponse>(entityEndpoint, {
        method: 'POST',
        body: data,
        query: buildQueryObject(options),
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
      });
    },

    async delete(id: string): Promise<void> {
      await fetch<null>(`${entityEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}
