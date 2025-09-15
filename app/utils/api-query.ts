import type { ApiOptions } from '#shared/types';

/**
 * Builds a query string from ApiOptions
 * @param options - The API options containing fields and other parameters
 * @returns Query string with leading '?' or empty string if no params
 */
export function buildQuery<TFields = string>(
  options?: ApiOptions<TFields>,
): string {
  const params = new URLSearchParams();

  if (options?.fields && options.fields.length > 0) {
    params.append('fields', options.fields.join(','));
  }

  // Can be extended to handle other common query parameters like:
  // if (options?.page) params.append('page', String(options.page));
  // if (options?.pageSize) params.append('pageSize', String(options.pageSize));

  return params.toString() ? `?${params.toString()}` : '';
}

/**
 * Builds a query object from ApiOptions for use with Nitro fetch
 * @param options - The API options containing fields and other parameters
 * @returns Query object or undefined if no params
 */
export function buildQueryObject<TFields = string>(
  options?: ApiOptions<TFields>,
): Record<string, string> | undefined {
  const queryObj: Record<string, string> = {};

  if (options?.fields && options.fields.length > 0) {
    queryObj.fields = options.fields.join(',');
  }

  // Can be extended to handle other common query parameters like:
  // if (options?.page) queryObj.page = String(options.page);
  // if (options?.pageSize) queryObj.pageSize = String(options.pageSize);

  return Object.keys(queryObj).length > 0 ? queryObj : undefined;
}
