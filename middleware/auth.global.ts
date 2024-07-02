export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data } = useAuth()
  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    return;
  }
  if (!((data.value as unknown as { roles: string[] })?.roles || []).includes('authed')) {
    await navigateTo('/auth/login', {
      external: true,
    });
  }
});
