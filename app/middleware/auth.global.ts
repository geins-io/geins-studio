export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useGeinsAuth() || {};

  if (to.path.startsWith('/auth')) {
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
