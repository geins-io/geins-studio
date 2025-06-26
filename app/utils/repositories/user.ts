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
    password: {
      beginRestore: async (
        email: string,
        callbackUrl: string,
      ): Promise<void> => {
        await fetch(`${BASE_ENDPOINT}/password/restore`, {
          method: 'POST',
          body: { username: email, callbackUrl },
        });
      },
      restore: async (token: string, password: string): Promise<void> => {
        await fetch(`${BASE_ENDPOINT}/password`, {
          method: 'POST',
          body: { token, newPassword: password },
        });
      },
    },
  };
}
