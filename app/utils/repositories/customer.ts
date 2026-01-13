import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  CustomerCompany,
  CustomerCompanyCreate,
  CustomerCompanyUpdate,
  CompanyBuyer,
  CompanyBuyerCreate,
  CompanyBuyerUpdate,
  CustomerVatValidation,
  CustomerCompanyApiOptions,
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from '#shared/types';

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing customer company operations
 */
export function customerRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const companyEndpoint = `${BASE_ENDPOINT}/account`;
  const companyRepo = repo.entity<
    CustomerCompany,
    CustomerCompanyCreate,
    CustomerCompanyUpdate,
    CustomerCompanyApiOptions
  >(companyEndpoint, fetch);

  const buyerEndpoint = `${BASE_ENDPOINT}/buyer`;
  const buyerRepo = repo.entityBase<CompanyBuyer>(buyerEndpoint, fetch);

  const customerEndpoint = `${BASE_ENDPOINT}/customer`;
  const subCustomerRepo = repo.entity<Customer, CustomerCreate, CustomerUpdate>(
    customerEndpoint,
    fetch,
  );

  return {
    company: {
      ...companyRepo,
      tags: {
        async get(): Promise<string[]> {
          return await fetch<string[]>(`${companyEndpoint}/tag/list`);
        },
      },
      id: (companyId: string) => {
        const companyIdEndpoint = `${companyEndpoint}/${companyId}`;

        const companyBuyerEndpoint = `${companyIdEndpoint}/buyer`;
        const buyerEntityRepo = repo.entity<
          CompanyBuyer,
          CompanyBuyerCreate,
          CompanyBuyerUpdate
        >(companyBuyerEndpoint, fetch);
        return {
          buyer: {
            ...buyerEntityRepo,
            async assign(id: string): Promise<void> {
              await fetch<null>(`${companyBuyerEndpoint}/${id}`, {
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
