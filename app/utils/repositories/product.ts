import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  ProductPricelist,
  ProductPricelistCreate,
  ProductPricelistUpdate,
  PricelistProduct,
  PricelistProductPatch,
  Product,
  ProductCreate,
  ProductUpdate,
  QueryResult,
} from '#shared/types';

const BASE_ENDPOINT = '/product';

/**
 * Repository for managing wholesale operations with subsections
 */
export function productRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const productRepo = repo.entity<Product, ProductCreate, ProductUpdate>(
    BASE_ENDPOINT,
    fetch,
  );

  const pricelistEndpoint = `${BASE_ENDPOINT}/pricelist`;
  const pricelistRepo = repo.entity<
    ProductPricelist,
    ProductPricelistCreate,
    ProductPricelistUpdate
  >(pricelistEndpoint, fetch);

  return {
    ...productRepo,

    async list(query?: Record<string, unknown>): Promise<QueryResult<Product>> {
      return await fetch<QueryResult<Product>>(
        `${BASE_ENDPOINT}/query`,

        {
          method: 'POST',
          body: {
            all: true,
          },
          query,
        },
      );
    },

    async query(
      selection?: SelectorSelectionBase,
      query?: Record<string, unknown>,
    ): Promise<QueryResult<Product>> {
      return await fetch<QueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
        method: 'POST',
        body: {
          ...selection,
        },
        query,
      });
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
  };
}
