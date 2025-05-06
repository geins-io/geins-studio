import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { WholesaleAccount, WholesaleAccountInput } from '#shared/types';

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing wholesale operations with subsections
 */
export function wholesaleRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  // Create repositories for subsections
  const entityEndpoint = `${BASE_ENDPOINT}/account`;
  const accountRepo = repo.entity<WholesaleAccount, WholesaleAccountInput>(
    entityEndpoint,
    fetch,
  );

  return {
    account: {
      ...accountRepo,
      tags: {
        async get(id: string): Promise<string[]> {
          return await fetch<string[]>(`${entityEndpoint}/${id}/tag/list`);
        },
      },
    },
  };
}
