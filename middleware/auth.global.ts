export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }

  if (process.env.VITEST || auth.data.value?.isAuthorized) {
    return;
  }

  await navigateTo('/auth/login', {
    external: true,
  });
});
