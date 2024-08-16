export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // Logging all vue errors, even handled ones
    console.error(error, instance, info);
  };
});
