import { defineStore } from 'pinia';

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
    return user.value?.email || 'N/A';
  });

  return {
    user,
    userInitials,
    userName,
    userEmail,
  };
});
