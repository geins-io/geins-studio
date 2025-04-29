import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { WholesaleAccount, WholesaleAccountInput } from '#shared/types'; // Define these types

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing wholesale operations with subsections
 */
export function wholesaleRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  // Create repositories for subsections
  const accountRepo = repo.entity<WholesaleAccount, WholesaleAccountInput>(
    `${BASE_ENDPOINT}/account`,
    fetch,
  );

  return {
    account: {
      ...accountRepo,
    },
  };
}
