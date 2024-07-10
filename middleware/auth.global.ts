import type { Session } from '~/types/auth/Auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = useAuth();
  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }

  if (data.value && (data.value as unknown as Session).isAuthorized) {
    return;
  }

  await navigateTo('/auth/login', {
    external: true,
  });
});
