import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Customer, CustomerCreate, CustomerUpdate } from '#shared/types';

const BASE_ENDPOINT = '/wholesale/customer';

export function customerRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const customerRepo = repo.entity<Customer, CustomerCreate, CustomerUpdate>(
    BASE_ENDPOINT,
    fetch,
  );

  return {
    ...customerRepo,
  };
}
