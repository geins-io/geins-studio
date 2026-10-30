import { defineStore } from 'pinia';

/**
 * User store — the signed-in user, loaded from `user/me` (with accounts).
 *
 * The auth session carries tokens only; `init()` loads the user through
 * `$geinsApi` (at boot by the `geins-global` plugin, and on the login page for
 * account selection). Provides computed display properties: initials (for
 * avatars), full name, email, accounts, and role/permission accessors.
 *
 * @example
 * ```ts
 * const userStore = useUserStore();
 * const { userInitials, userName, userEmail } = storeToRefs(userStore);
 * ```
 */
export const useUserStore = defineStore('user', () => {
  const { session } = useGeinsAuth();
  const { userApi } = useGeinsRepository();
  const { geinsLogWarn } = useGeinsLog('stores/user.ts');
  const user = ref<User>();
  let pendingInit: Promise<void> | null = null;

  /**
   * Loads the signed-in user. Concurrent calls share one request; a failure
   * is logged and leaves `user` as it was.
   */
  async function init(): Promise<void> {
    pendingInit ??= userApi.me
      .get({ fields: ['accounts'] })
      .then((data) => {
        user.value = data;
      })
      .catch((error) => {
        geinsLogWarn('error fetching user:', error);
      })
      .finally(() => {
        pendingInit = null;
      });
    return pendingInit;
  }

  function reset(): void {
    user.value = undefined;
  }

  const userInitials = computed(() => {
    if (!user.value) {
      return '';
    }

    const firstName = user.value.firstName?.trim();
    const lastName = user.value.lastName?.trim();

    // If both names exist, take first letter of each
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    // If only first name exists, take first two letters
    if (firstName && firstName.length >= 2) {
      return firstName.substring(0, 2).toUpperCase();
    }

    // If only last name exists, take first two letters
    if (lastName && lastName.length >= 2) {
      return lastName.substring(0, 2).toUpperCase();
    }

    // Fallback to email
    const fallbackFromEmail = user.value.email?.substring(0, 2).toUpperCase();
    return fallbackFromEmail || 'N/A';
  });

  const userName = computed(() => {
    return fullName(user.value);
  });

  const userEmail = computed(() => {
    return user.value?._id || 'N/A';
  });

  // Merge: a profile update response may omit fields we loaded (accounts).
  const updateUser = (newUser: User) => {
    user.value = { ...user.value, ...newUser };
  };

  const userAccounts = computed(() => {
    const accounts = user.value?.basicAccounts || [];
    return [...accounts].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  });

  const currentAccountName = computed(() => {
    const account = userAccounts.value.find(
      (acc) => acc.accountKey === session.value?.accountKey,
    );
    return account ? account.name : '';
  });

  const hasMultipleAccounts = computed(() => {
    return userAccounts.value.length > 1;
  });

  /**
   * Check if user has any of the specified roles
   * TODO: Implement role checking once user roles are available in the session
   * For now, returns true (all users have access)
   */
  const hasAnyRole = (_roles: string[]): boolean => {
    // TODO: Implement actual role checking
    // Example: return roles.some(role => user.value?.roles?.includes(role))
    return true;
  };

  /**
   * Check if user has any of the specified permissions
   * TODO: Implement permission checking once user permissions are available
   * For now, returns true (all users have access)
   */
  const hasAnyPermission = (_permissions: string[]): boolean => {
    // TODO: Implement actual permission checking
    // Example: return permissions.some(perm => user.value?.permissions?.includes(perm))
    return true;
  };

  return {
    user,
    userInitials,
    userName,
    userEmail,
    userAccounts,
    currentAccountName,
    hasMultipleAccounts,
    init,
    reset,
    updateUser,
    hasAnyRole,
    hasAnyPermission,
  };
});
