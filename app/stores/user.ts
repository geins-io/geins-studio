import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const auth = useAuth();
  const user = ref(auth.data.value?.user);

  const avatarInitials = computed(() => {
    if (!user.value) {
      return '';
    }

    return `${user.value.firstName[0]}${user.value.lastName[0]}`;
  });

  return {
    user,
    avatarInitials,
  };
});
