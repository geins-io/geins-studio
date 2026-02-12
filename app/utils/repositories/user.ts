import type {
  User,
  UserProfileUpdate,
  UserProfileApiOptions,
  UserCreate,
  UserUpdate,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/user';

/**
 * Repository for managing user operations.
 *
 * Extends base entity CRUD with profile-specific endpoints:
 * - `me.get()` / `me.update()` — current user profile
 * - `me.password.update()` — password change
 *
 * @param fetch - Authenticated $fetch instance ($geinsApi)
 */
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
          await fetch<undefined>(`${BASE_ENDPOINT}/me/password`, {
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
