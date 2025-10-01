export default defineNuxtPlugin((nuxtApp) => {
  const { geinsLogError } = useGeinsLog('plugins/error-handler.ts');
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    if (error instanceof Error && error.message === 'AUTH_ERROR') {
      geinsLogError('authentication error:', error, instance, info);
      navigateTo('/auth/login');
    }
    if (error instanceof Error && error.message === 'API_ERROR') {
      geinsLogError('api connection error:', error, instance, info);
    } else {
      geinsLogError(error, instance, info);
    }
  };
});
