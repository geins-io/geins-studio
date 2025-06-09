import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  WholesaleAccount,
  WholesaleAccountCreate,
  WholesaleAccountUpdate,
  WholesaleBuyer,
  WholesaleBuyerCreate,
  WholesaleBuyerUpdate,
  ProductPricelistCreate,
  WholesaleVatValidation,
} from '#shared/types';

const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing wholesale operations with subsections
 */
export function wholesaleRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const accountEndpoint = `${BASE_ENDPOINT}/account`;
  const accountRepo = repo.entity<
    WholesaleAccount,
    WholesaleAccountCreate,
    WholesaleAccountUpdate
  >(accountEndpoint, fetch);

  const buyerEndpoint = `${BASE_ENDPOINT}/buyer`;
  const buyerRepo = repo.entityBase<WholesaleBuyer>(buyerEndpoint, fetch);

  const pricelistEndpoint = `${BASE_ENDPOINT}/pricelist`;
  const pricelistRepo = repo.entity<
    ProductPricelist,
    ProductPricelistCreate,
    ProductPricelistUpdate
  >(pricelistEndpoint, fetch);

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
          WholesaleBuyer,
          WholesaleBuyerCreate,
          WholesaleBuyerUpdate
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
    pricelist: {
      ...pricelistRepo,
      id: (pricelistId: string) => {
        const pricelistIdEndpoint = `${pricelistEndpoint}/${pricelistId}`;
        return {
          products: {
            async patch(
              productsPatch: PricelistProductPatch,
            ): Promise<PricelistProduct[]> {
              return await fetch<PricelistProduct[]>(
                `${pricelistIdEndpoint}/products`,
                {
                  method: 'PATCH',
                  body: productsPatch,
                },
              );
            },
          },
        };
      },
    },
    validateVatNumber: async (
      vatNumber: string,
    ): Promise<WholesaleVatValidation> => {
      return await fetch<WholesaleVatValidation>(
        `${BASE_ENDPOINT}/validateVatNumber/${vatNumber}`,
        {
          method: 'POST',
        },
      );
    },
  };
}
