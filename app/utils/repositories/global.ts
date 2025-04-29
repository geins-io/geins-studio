import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Account, Channel, Product } from '#shared/types';

const ENDPOINTS = {
  PRODUCT: '/product',
  CATEGORY: '/product/category',
  BRAND: '/product/brand',
  ACCOUNT: '/user/me',
  CHANNELS: '/account/channel/list',
  CURRENCY: '/account/currency/list',
  LANGUAGE: '/account/language/list',
};

export const globalRepo = <T>(fetch: $Fetch<T, NitroFetchRequest>) => ({
  product: {
    async get(id: number, fields?: string): Promise<Product> {
      const queryParams = fields ? `?fields=${fields}` : '';
      return await fetch<Product>(`${ENDPOINTS.PRODUCT}/${id}${queryParams}`);
    },
    list: {
      async get(fields?: string): Promise<QueryResult<Product>> {
        const queryParams = fields ? `?fields=${fields}` : '';
        return await fetch<QueryResult<Product>>(
          `${ENDPOINTS.PRODUCT}/query${queryParams}`,
          {
            method: 'POST',
            body: {
              all: true,
            },
          },
        );
      },
      async query(
        selection?: SelectorSelectionBase,
        fields?: string,
      ): Promise<QueryResult<Product>> {
        const queryParams = fields ? `?fields=${fields}` : '';
        return await fetch<QueryResult<Product>>(
          `${ENDPOINTS.PRODUCT}/query${queryParams}`,
          {
            method: 'POST',
            body: {
              ...selection,
            },
          },
        );
      },
    },
  },
  category: {
    async get(id: number): Promise<Category> {
      return await fetch<Category>(`${ENDPOINTS.CATEGORY}/${id}`);
    },
    list: {
      async get(): Promise<QueryResult<Category>> {
        return await fetch<QueryResult<Category>>(
          `${ENDPOINTS.CATEGORY}/query`,
          {
            method: 'POST',
            body: {
              all: true,
            },
          },
        );
      },
      async query(ids: number[]): Promise<QueryResult<Category>> {
        return await fetch<QueryResult<Category>>(
          `${ENDPOINTS.CATEGORY}/query`,
          {
            method: 'POST',
            body: {
              categoryIds: ids,
            },
          },
        );
      },
    },
  },
  brand: {
    async get(id: number): Promise<Brand> {
      return await fetch<Brand>(`${ENDPOINTS.BRAND}/${id}`);
    },
    list: {
      async get(): Promise<QueryResult<Brand>> {
        return await fetch<QueryResult<Brand>>(`${ENDPOINTS.BRAND}/query`, {
          method: 'POST',
          body: {
            all: true,
          },
        });
      },
      async query(ids: number[]): Promise<Brand[]> {
        return await fetch<Brand[]>(`${ENDPOINTS.BRAND}/query`, {
          method: 'POST',
          body: {
            brandIds: ids,
          },
        });
      },
    },
  },
  account: {
    async get(): Promise<Account> {
      return await fetch<Account>(ENDPOINTS.ACCOUNT);
    },
  },
  channel: {
    async list(): Promise<Channel[]> {
      return await fetch<Channel[]>(ENDPOINTS.CHANNELS);
    },
  },
  currency: {
    async list(): Promise<Currency[]> {
      return await fetch<Currency[]>(ENDPOINTS.CURRENCY);
    },
  },
  language: {
    async list(): Promise<Language[]> {
      return await fetch<Language[]>(ENDPOINTS.LANGUAGE);
    },
  },
});
