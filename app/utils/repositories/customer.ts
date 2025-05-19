import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { Customer } from '#shared/types';

const BASE_ENDPOINT = '/wholesale/customer';

export function customerRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const customerRepo = repo.entity<Customer, Customer>(BASE_ENDPOINT, fetch);

  return {
    ...customerRepo,
  };
}
