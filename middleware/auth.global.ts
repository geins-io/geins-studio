export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = useAuth();
  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }

  if (data.value && data.value.isAuthorized) {
    return;
  }

  await navigateTo('/auth/login', {
    external: true,
  });
});
