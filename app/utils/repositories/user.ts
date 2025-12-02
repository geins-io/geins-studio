import type { NitroFetchRequest, $Fetch } from 'nitropack';
import type {
  User,
  UserProfileUpdate,
  UserProfileApiOptions,
} from '#shared/types';

const BASE_ENDPOINT = '/user';

export function userRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const userRepo = repo.entity<User, UserCreate, UserUpdate>(
    BASE_ENDPOINT,
    fetch,
  );

  return {
    ...userRepo,
    me: {
      async get(options?: UserProfileApiOptions): Promise<User> {
        return await fetch<User>(`${BASE_ENDPOINT}/me`, {
          method: 'GET',
          query: buildQueryObject(options),
        });
      },
      async update(
        _id: string,
        data: UserProfileUpdate,
        options?: UserProfileApiOptions,
      ): Promise<User> {
        return await fetch<User>(`${BASE_ENDPOINT}/me`, {
          method: 'PUT',
          body: data,
          query: buildQueryObject(options),
        });
      },
      password: {
        async update(
          currentPassword: string,
          newPassword: string,
        ): Promise<void> {
          await fetch<void>(`${BASE_ENDPOINT}/me/password`, {
            method: 'POST',
            body: { currentPassword, newPassword },
          });
        },
      },
    },
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
