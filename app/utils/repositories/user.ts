import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { User, UserInput } from '#shared/types';

const BASE_ENDPOINT = '/user';

export function userRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const userRepo = repo.entity<User, UserInput>(BASE_ENDPOINT, fetch);

  return {
    ...userRepo,
  };
}
