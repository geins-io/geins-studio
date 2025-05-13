import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  WholesaleAccount,
  WholesaleAccountInput,
  WholesaleBuyer,
} from '#shared/types';

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing wholesale operations with subsections
 */
export function wholesaleRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const accountEndpoint = `${BASE_ENDPOINT}/account`;
  const accountRepo = repo.entity<WholesaleAccount, WholesaleAccountInput>(
    accountEndpoint,
    fetch,
  );

  const buyerEndpoint = `${BASE_ENDPOINT}/buyer`;
  const buyerRepo = repo.entityBase<WholesaleBuyer>(buyerEndpoint, fetch);

  return {
    account: {
      ...accountRepo,
      tags: {
        async get(): Promise<string[]> {
          return await fetch<string[]>(`${accountEndpoint}/tag/list`);
        },
      },
      id: (accountId: string) => {
        const accountIdEndpoint = `${accountEndpoint}/${accountId}`;

        const accountBuyerEndpoint = `${accountIdEndpoint}/buyer`;
        const buyerEntityRepo = repo.entity<WholesaleBuyer, WholesaleBuyer>(
          accountBuyerEndpoint,
          fetch,
        );
        return {
          buyer: {
            ...buyerEntityRepo,
            async assign(id: string): Promise<void> {
              return await fetch(`${accountBuyerEndpoint}/${id}`, {
                method: 'POST',
              });
            },
          },
        };
      },
    },
    buyer: {
      ...buyerRepo,
    },
  };
}
