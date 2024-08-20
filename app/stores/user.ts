import { defineStore } from 'pinia';
import type { User } from '@/types/auth/Auth';

export const useUserStore = defineStore('user', () => {
  const auth = useAuth();
  const user = ref<User | undefined>(auth.data.value?.user);

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
