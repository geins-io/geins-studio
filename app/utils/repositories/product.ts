import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  ProductPricelist,
  ProductPricelistCreate,
  ProductPricelistUpdate,
  Product,
  ProductCreate,
  ProductUpdate,
  BatchQueryResult,
  BatchQuery,
  PricelistProduct,
} from '#shared/types';

const { batchQueryAll } = useBatchQuery();

const BASE_ENDPOINT = '/product';

/**
 * Repository for managing wholesale operations with subsections
 */
export function productRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const productRepo = repo.entity<Product, ProductCreate, ProductUpdate>(
    BASE_ENDPOINT,
    fetch,
  );

  const categoryEndpoint = `${BASE_ENDPOINT}/category`;

  const brandEndpoint = `${BASE_ENDPOINT}/brand`;

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
          body: batchQueryAll.value,
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
          ...batchQueryAll.value,
          ...selection,
        },
        query,
      });
    },

    // TODO: proper entity repos for category and brand
    category: {
      async get(id: number): Promise<Category> {
        return await fetch<Category>(`${categoryEndpoint}/${id}`);
      },
      async list(
        query?: Record<string, unknown>,
      ): Promise<BatchQueryResult<Category>> {
        return await fetch<BatchQueryResult<Category>>(
          `${categoryEndpoint}/query`,

          {
            method: 'POST',
            body: batchQueryAll.value,
            query,
          },
        );
      },
      async query(ids: number[]): Promise<BatchQueryResult<Category>> {
        return await fetch<BatchQueryResult<Category>>(
          `${categoryEndpoint}/query`,
          {
            method: 'POST',
            body: {
              ...batchQueryAll.value,
              categoryIds: ids,
            },
          },
        );
      },
    },

    brand: {
      async get(id: number): Promise<Brand> {
        return await fetch<Brand>(`${brandEndpoint}/${id}`);
      },
      async list(
        query?: Record<string, unknown>,
      ): Promise<BatchQueryResult<Brand>> {
        return await fetch<BatchQueryResult<Brand>>(
          `${brandEndpoint}/query`,

          {
            method: 'POST',
            body: batchQueryAll.value,
            query,
          },
        );
      },
      async query(ids: number[]): Promise<BatchQueryResult<Brand>> {
        return await fetch<BatchQueryResult<Brand>>(`${brandEndpoint}/query`, {
          method: 'POST',
          body: {
            ...batchQueryAll.value,
            brandIds: ids,
          },
        });
      },
    },

    pricelist: {
      ...pricelistRepo,
      id: (pricelistId: string) => {
        const pricelistIdEndpoint = `${pricelistEndpoint}/${pricelistId}`;
        return {
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
            pricelist: ProductPricelistUpdate,
            batchQuery?: BatchQuery,
            query?: Record<string, string>,
          ): Promise<ProductPricelist> {
            return await fetch<ProductPricelist>(
              `${pricelistIdEndpoint}/preview`,
              {
                method: 'POST',
                body: {
                  pricelist,
                  batchQuery,
                },
                query,
              },
            );
          },
          async previewPrice(
            pricelistProduct: PricelistProductPreview,
          ): Promise<PricelistProductPreviewResponse> {
            return await fetch<PricelistProductPreviewResponse>(
              `${pricelistIdEndpoint}/previewprice`,
              {
                method: 'POST',
                body: {
                  ...pricelistProduct,
                },
              },
            );
          },
        };
      },
    },
  };
}
