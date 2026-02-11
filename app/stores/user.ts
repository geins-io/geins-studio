import { defineStore } from 'pinia';

/**
 * User store — derives current user info from the auth session.
 *
 * Provides computed display properties: initials (for avatars), full name,
 * email, and role/permission accessors. Reactive to session changes.
 *
 * @example
 * ```ts
 * const userStore = useUserStore();
 * const { userInitials, userName, userEmail } = storeToRefs(userStore);
 * ```
 */
export const useUserStore = defineStore('user', () => {
  const { session } = useGeinsAuth();
  const user = ref(session.value?.user);

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
    return `${user.value?.firstName || ''} ${user.value?.lastName || ''}`;
  });

  const userEmail = computed(() => {
    return user.value?._id || 'N/A';
  });

  const updateUser = (newUser: User) => {
    user.value = newUser;
  };

  const userAccounts = computed(() => {
    return user.value?.basicAccounts || [];
  });

  const currentAccountName = computed(() => {
    const account = userAccounts.value.find(
      (acc) => acc.accountKey === session.value?.accountKey,
    );
    return account ? account.displayName : '';
  });

  const hasMultipleAccounts = computed(() => {
    return userAccounts.value.length > 1;
  });

  /**
   * Check if user has any of the specified roles
   * TODO: Implement role checking once user roles are available in the session
   * For now, returns true (all users have access)
   */
  const hasAnyRole = (roles: string[]): boolean => {
    // TODO: Implement actual role checking
    // Example: return roles.some(role => user.value?.roles?.includes(role))
    return true;
  };

  /**
   * Check if user has any of the specified permissions
   * TODO: Implement permission checking once user permissions are available
   * For now, returns true (all users have access)
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
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
    updateUser,
    hasAnyRole,
    hasAnyPermission,
  };
});
