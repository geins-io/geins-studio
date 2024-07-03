export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data } = useAuth();
  console.log('auth.global.ts', data.value);
  //return;
});
