import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  WholesalePricelist,
  WholesalePricelistCreate,
  WholesalePricelistUpdate,
  WholesalePricelistProduct,
  WholesalePricelistProductPatch,
} from '#shared/types';

const BASE_ENDPOINT = '/product';

/**
 * Repository for managing wholesale operations with subsections
 */
export function productRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const pricelistEndpoint = `${BASE_ENDPOINT}/pricelist`;
  const pricelistRepo = repo.entity<
    WholesalePricelist,
    WholesalePricelistCreate,
    WholesalePricelistUpdate
  >(pricelistEndpoint, fetch);

  return {
    pricelist: {
      ...pricelistRepo,
      id: (pricelistId: string) => {
        const pricelistIdEndpoint = `${pricelistEndpoint}/${pricelistId}`;
        return {
          products: {
            async patch(
              productsPatch: WholesalePricelistProductPatch,
            ): Promise<WholesalePricelistProduct[]> {
              return await fetch<WholesalePricelistProduct[]>(
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
  };
}
