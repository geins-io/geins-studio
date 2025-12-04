import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  ProductPriceList,
  ProductPriceListCreate,
  ProductPriceListUpdate,
  Product,
  ProductCreate,
  ProductUpdate,
  BatchQueryResult,
  BatchQuery,
  ProductApiOptions,
  ProductPriceListApiOptions,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';

const { batchQueryMatchAll, batchQueryNoPagination } = useBatchQuery();

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

  const priceListEndpoint = `${BASE_ENDPOINT}/pricelist`;
  const priceListRepo = repo.entity<
    ProductPriceList,
    ProductPriceListCreate,
    ProductPriceListUpdate
  >(priceListEndpoint, fetch);

  return {
    ...productRepo,

    async list(
      options?: ProductApiOptions,
    ): Promise<BatchQueryResult<Product>> {
      return await fetch<BatchQueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
        method: 'POST',
        body: { ...batchQueryMatchAll.value, ...batchQueryNoPagination.value },
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
          ...batchQueryNoPagination.value,
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
            body: {
              ...batchQueryMatchAll.value,
              ...batchQueryNoPagination.value,
            },
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
              ...batchQueryNoPagination.value,
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
            body: {
              ...batchQueryMatchAll.value,
              ...batchQueryNoPagination.value,
            },
            query,
          },
        );
      },
      async query(ids: number[]): Promise<BatchQueryResult<Brand>> {
        return await fetch<BatchQueryResult<Brand>>(`${brandEndpoint}/query`, {
          method: 'POST',
          body: {
            ...batchQueryNoPagination.value,
            brandIds: ids,
          },
        });
      },
    },

    priceList: {
      ...priceListRepo,
      id: (priceListId: string) => {
        const priceListIdEndpoint = `${priceListEndpoint}/${priceListId}`;
        return {
          async copy(
            options?: ProductPriceListApiOptions,
          ): Promise<ProductPriceList> {
            return await fetch<ProductPriceList>(
              `${priceListIdEndpoint}/copy`,
              {
                method: 'POST',
                query: buildQueryObject(options),
              },
            );
          },
          async preview(
            priceList: ProductPriceListUpdate,
            batchQuery?: BatchQuery,
            options?: ProductPriceListApiOptions,
          ): Promise<ProductPriceList> {
            return await fetch<ProductPriceList>(
              `${priceListIdEndpoint}/preview`,
              {
                method: 'POST',
                body: {
                  priceList,
                  batchQuery,
                },
                query: buildQueryObject(options),
              },
            );
          },
          async previewPrice(
            priceListProduct: PriceListProductPreview,
          ): Promise<PriceListProductPreviewResponse> {
            return await fetch<PriceListProductPreviewResponse>(
              `${priceListIdEndpoint}/previewprice`,
              {
                method: 'POST',
                body: {
                  ...priceListProduct,
                },
              },
            );
          },
        };
      },
    },
  };
}
