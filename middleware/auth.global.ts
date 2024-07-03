export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data } = useAuth();
  console.log('auth.global.ts --> ATUTH DATA', data.value);
  console.log('auth.global.ts --> TO', to.path);

  if (
    to.path.includes('/login') ||
    to.path.includes('/auth/') ||
    to.path.includes('/api/')
  ) {
    console.log('auth.global.ts IS AUTH OR API PATHS', to.path);
    return;
  }

  if (data.value && (data.value as any).isAuthorized) {
    console.log(
      'auth.global.ts --> isAuthorized',
      (data.value as any).isAuthorized,
    );
    return;
  }

  console.log('auth.global.ts --> NOT AUTHORIZED');
  await navigateTo('/auth/login', {
    external: true,
  });

  //return;
});
