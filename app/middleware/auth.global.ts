import { useBroadcastChannel } from '@vueuse/core';

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useGeinsAuth();
  const { post: broadcastPost } = useBroadcastChannel<
    AuthBroadcastData,
    AuthBroadcastData
  >({
    name: 'geins-auth',
  });

  if (to.path.startsWith('/auth')) {
    if (to.path.includes('logout')) {
      broadcastPost({
        session: null,
      });
    }
    return isAuthenticated.value ? navigateTo('/') : true;
  }

  if (process.env.VITEST || isAuthenticated.value) {
    return;
  }

  const redirect = to.path === '/' ? '' : `?redirect=${to.fullPath}`;

  return navigateTo(`/auth/login${redirect}`, {
    external: true,
  });
});
