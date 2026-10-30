export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, broadcastAuthSignal } = useGeinsAuth();

  if (to.path.startsWith('/auth')) {
    // Every logout lands here once next-auth has cleared the shared cookie
    if (to.path.includes('logout') && !isAuthenticated.value) {
      broadcastAuthSignal({ type: 'signed-out' });
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
