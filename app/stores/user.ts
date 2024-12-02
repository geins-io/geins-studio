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

    return `${firstNameInitial}${lastNameInitial}` || 'N/A';
  });

  return {
    user,
    userInitials,
  };
});
