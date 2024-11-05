export default defineNuxtRouteMiddleware(async (to) => {
  const { status, data } = useAuth() || {};
  const authenticated =
    status?.value === 'authenticated' && data?.value?.isAuthorized;

  if (to.path.startsWith('/auth')) {
    return authenticated ? navigateTo('/') : true;
  }

  if (process.env.VITEST || authenticated) {
    return;
  }

  const redirect = to.path === '/' ? '' : `?redirect=${to.fullPath}`;

  return navigateTo(`/auth/login${redirect}`, {
    external: true,
  });
});
