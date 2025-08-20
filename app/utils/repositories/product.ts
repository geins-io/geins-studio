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
  BatchQueryResult,
  BatchQuery,
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

    async list(
      query?: Record<string, unknown>,
    ): Promise<BatchQueryResult<Product>> {
      return await fetch<BatchQueryResult<Product>>(
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
      selection?: SelectorSelectionQueryBase,
      query?: Record<string, string>,
    ): Promise<BatchQueryResult<Product>> {
      return await fetch<BatchQueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
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
          // products: {
          //   async patch(
          //     productsPatch: PricelistProductPatch,
          //   ): Promise<PricelistProduct[]> {
          //     return await fetch<PricelistProduct[]>(
          //       `${pricelistIdEndpoint}/products`,
          //       {
          //         method: 'PATCH',
          //         body: productsPatch,
          //       },
          //     );
          //   },
          // },
          async copy(query?: Record<string, string>) {
            return await fetch<ProductPricelist>(
              `${pricelistIdEndpoint}/copy`,
              {
                method: 'POST',
                query,
              },
            );
          },
          async preview(
            priceList: ProductPricelistUpdate,
            batchQuery?: BatchQuery,
          ): Promise<BatchQueryResult<PricelistProduct>> {
            return await fetch<Promise<BatchQueryResult<PricelistProduct>>>(
              `${pricelistIdEndpoint}/preview`,
              {
                method: 'POST',
                body: {
                  priceList,
                  batchQuery,
                },
              },
            );
          },
        };
      },
    },
  };
}
