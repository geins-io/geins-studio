import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const { session } = useGeinsAuth();
  const user = ref(session.value?.user);

  const userInitials = computed(() => {
    if (!user.value) {
      return '';
    }

    const firstNameInitial = user.value.firstName?.length
      ? user.value.firstName[0]
      : '';
    const lastNameInitial = user.value.lastName?.length
      ? user.value.lastName[0]
      : '';

    const fallbackFromEmail = user.value.email?.substring(0, 2).toUpperCase();

    return (
      `${firstNameInitial}${lastNameInitial}` || fallbackFromEmail || 'N/A'
    );
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
