import type { SelectorCondition } from './Selector';

export interface BatchQuery {
  _id?: string;
  page?: number;
  pageSize?: number;
  all?: boolean;
}

export interface BatchQueryFiltered<T> extends BatchQuery {
  include?: BatchQueryFilterGroup<T>[];
  exclude?: BatchQueryFilterGroup<T>[];
}

export interface BatchQueryFilterGroup<T> extends BatchQuery {
  condition?: SelectorCondition;
  selections: T[];
}

export interface BatchQueryResult<T> {
  _id: string;
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}

export interface ApiOptions<TFields> {
  fields?: TFields[];
  pageSize?: string;
}

/**
 * Typed fetch interface for the Geins API client.
 *
 * Provides the callable API surface used throughout the app for
 * API communication. This avoids importing Nitro's complex `$Fetch`
 * type which can cause excessive TypeScript stack depth due to
 * route type resolution.
 *
 * @example
 * ```ts
 * const fetch: GeinsApiFetch = useNuxtApp().$geinsApi;
 * const data = await fetch<Product>('/product/123', { method: 'GET' });
 * ```
 */
export interface GeinsApiFetch {
  <T = unknown>(request: string, options?: Record<string, unknown>): Promise<T>;
}
