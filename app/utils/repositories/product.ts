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
  ApiOptions,
  ProductFieldsFilter,
  ProductApiOptions,
  ProductPricelistApiOptions,
} from '#shared/types';
import { buildQueryObject } from '../api-query';

const { batchQueryAll } = useBatchQuery();

const BASE_ENDPOINT = '/product';

/**
 * Repository for managing wholesale operations with subsections
 */
export function productRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const productRepo = repo.entity<
    Product,
    ProductCreate,
    ProductUpdate,
    ProductApiOptions
  >(BASE_ENDPOINT, fetch);

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
      options?: ProductApiOptions,
    ): Promise<BatchQueryResult<Product>> {
      return await fetch<BatchQueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
        method: 'POST',
        body: batchQueryAll.value,
        query: buildQueryObject(options),
      });
    },

    async query(
      selection?: SelectorSelectionQueryBase,
      options?: ProductApiOptions,
    ): Promise<BatchQueryResult<Product>> {
      return await fetch<BatchQueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
        method: 'POST',
        body: {
          ...batchQueryAll.value,
          ...selection,
        },
        query: buildQueryObject(options),
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
          async copy(
            options?: ProductPricelistApiOptions,
          ): Promise<ProductPricelist> {
            return await fetch<ProductPricelist>(
              `${pricelistIdEndpoint}/copy`,
              {
                method: 'POST',
                query: buildQueryObject(options),
              },
            );
          },
          async preview(
            pricelist: ProductPricelistUpdate,
            batchQuery?: BatchQuery,
            options?: ProductPricelistApiOptions,
          ): Promise<ProductPricelist> {
            return await fetch<ProductPricelist>(
              `${pricelistIdEndpoint}/preview`,
              {
                method: 'POST',
                body: {
                  pricelist,
                  batchQuery,
                },
                query: buildQueryObject(options),
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
