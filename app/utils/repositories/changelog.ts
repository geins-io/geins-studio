import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { ChangelogEntry } from '#shared/types';

const BASE_ENDPOINT = '/changelog';

/**
 * Repository for retrieving changelog entries from the changelog microservice,
 * routed through the existing GEINS_API_URL gateway.
 */
export function changelogRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    /**
     * Get changelog entries for a given entity type and entity ID.
     * Endpoint: GET /changelog/{entity}/{entityId}
     */
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
