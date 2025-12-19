import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { CustomerPriceList } from '#shared/types';

// Keep backend endpoint as /wholesale for now
const BASE_ENDPOINT = '/wholesale';

/**
 * Repository for managing pricing and price list operations
 */
export function pricingRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const priceListEndpoint = `${BASE_ENDPOINT}/price-list`;

  return {
    priceList: {
      async list(): Promise<CustomerPriceList[]> {
        return await fetch<CustomerPriceList[]>(`${priceListEndpoint}/list`);
      },
      async get(id: string): Promise<CustomerPriceList> {
        return await fetch<CustomerPriceList>(`${priceListEndpoint}/${id}`);
      },
      // Add more price list operations as needed
    },
  };
}
