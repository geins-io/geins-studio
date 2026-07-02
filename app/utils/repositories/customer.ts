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
import { ENTITIES } from '#shared/utils/entities';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing customer company operations
 */
export function customerRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const companyEndpoint = ENTITIES.company.endpoint;
  const companyRepo = repo.entity<
    CustomerCompany,
    CustomerCompanyCreate,
    CustomerCompanyUpdate,
    CustomerCompanyApiOptions
  >(ENTITIES.company, fetch);

  const buyerEndpoint = ENTITIES.buyer.endpoint;
  const buyerRepo = repo.entityBase<CompanyBuyer>(buyerEndpoint, fetch);

  const subCustomerRepo = repo.entity<Customer, CustomerCreate, CustomerUpdate>(
    ENTITIES.customer,
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
        >({ endpoint: companyBuyerEndpoint, key: 'buyer' }, fetch);
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
          // VAT validity is surfaced inline in the form, so a failed/invalid
          // lookup must not raise the global error toast.
          suppressErrorToast: true,
        },
      );
    },
    customer: {
      ...subCustomerRepo,
    },
  };
}
