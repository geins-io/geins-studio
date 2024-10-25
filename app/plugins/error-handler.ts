export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.log('error', error);
    if (error instanceof Error && error.message === 'AUTH_ERROR') {
      console.error('Authentication error occurred:', error);
      navigateTo('/auth/login');
    } else {
      console.error(error, instance, info);
    }
  };
});
