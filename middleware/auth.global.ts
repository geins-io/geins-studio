export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data } = useAuth();
  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }

  if (data.value && (data.value as any).isAuthorized) {
    return;
  }

  await navigateTo('/auth/login', {
    external: true,
  });
});
