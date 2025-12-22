import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  CustomerAccount,
  CustomerAccountCreate,
  CustomerAccountUpdate,
  CustomerBuyer,
  CustomerBuyerCreate,
  CustomerBuyerUpdate,
  CustomerVatValidation,
  CustomerAccountApiOptions,
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from '#shared/types';

// Keep backend endpoint as /wholesale for now
const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing customer account operations
 */
export function customerRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const accountEndpoint = `${BASE_ENDPOINT}/account`;
  const accountRepo = repo.entity<
    CustomerAccount,
    CustomerAccountCreate,
    CustomerAccountUpdate,
    CustomerAccountApiOptions
  >(accountEndpoint, fetch);

  const buyerEndpoint = `${BASE_ENDPOINT}/buyer`;
  const buyerRepo = repo.entityBase<CustomerBuyer>(buyerEndpoint, fetch);

  const customerEndpoint = `${BASE_ENDPOINT}/customer`;
  const subCustomerRepo = repo.entity<Customer, CustomerCreate, CustomerUpdate>(
    customerEndpoint,
    fetch,
  );

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
        const buyerEntityRepo = repo.entity<
          CustomerBuyer,
          CustomerBuyerCreate,
          CustomerBuyerUpdate
        >(accountBuyerEndpoint, fetch);
        return {
          buyer: {
            ...buyerEntityRepo,
            async assign(id: string): Promise<void> {
              await fetch<null>(`${accountBuyerEndpoint}/${id}`, {
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
    validateVatNumber: async (
      vatNumber: string,
    ): Promise<CustomerVatValidation> => {
      return await fetch<CustomerVatValidation>(
        `${BASE_ENDPOINT}/validateVatNumber/${vatNumber}`,
        {
          method: 'POST',
        },
      );
    },
    customer: {
      ...subCustomerRepo,
    },
  };
}
