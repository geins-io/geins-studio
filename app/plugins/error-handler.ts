export default defineNuxtPlugin((nuxtApp) => {
  const { geinsLogError } = useGeinsLog('plugins/error-handler.ts');
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // Extract safe info from instance without logging the entire reactive component
    const componentName =
      instance?.$options?.name || instance?.$?.type?.name || 'Unknown';
    const safeInfo = {
      component: componentName,
      lifecycle: info,
    };

    if (error instanceof Error && error.message === 'AUTH_ERROR') {
      geinsLogError('authentication error:', error, safeInfo);
      navigateTo('/auth/login');
    }
    if (error instanceof Error && error.message === 'API_ERROR') {
      geinsLogError('api connection error:', error, safeInfo);
    } else {
      geinsLogError(error, safeInfo);
    }
  };
});
