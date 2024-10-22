export default defineNuxtRouteMiddleware(async (to) => {
  const { status } = useAuth();

  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }

  if (process.env.VITEST || status.value === 'authenticated') {
    return;
  }

  return navigateTo('/auth/login', {
    external: true,
  });
});
