import { defineStore } from 'pinia';
import { type User } from '@/types/User';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const setUser = (newUser: User) => {
    user.value = newUser;
  };

  const resetUser = () => {
    user.value = null;
  };

  return {
    user,
    setUser,
    resetUser,
  };
});
