import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type { User, UserCreate, UserUpdate } from '#shared/types';

const BASE_ENDPOINT = '/user';

export function userRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const userRepo = repo.entity<User, UserCreate, UserUpdate>(
    BASE_ENDPOINT,
    fetch,
  );

  return {
    ...userRepo,
  };
}
