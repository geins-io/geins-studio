import type { ChangelogEntry } from '#shared/types';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/changelog';

export function changelogRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    async getForEntity(
      entity: string,
      entityId: string,
    ): Promise<ChangelogEntry[]> {
      return await fetch<ChangelogEntry[]>(
        `${BASE_ENDPOINT}/${entity}/${entityId}`,
      );
    },
  };
}
