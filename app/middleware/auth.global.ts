export default defineNuxtRouteMiddleware(async (to) => {
  console.log('🚀 ~ defineNuxtRouteMiddleware ~ to.path:', to.path);

  const { isAuthenticated } = useGeinsAuth();
  console.log(
    '🚀 ~ defineNuxtRouteMiddleware ~ isAuthenticated.value:',
    isAuthenticated.value,
  );

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
