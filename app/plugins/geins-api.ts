export default defineNuxtPlugin((_nuxtApp) => {
  const { data } = useAuth();

  const geinsApi = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (data.value?.isAuthorized) {
        console.log(
          '🚀 ~ onRequest ~ data.value?.accessToken:',
          data.value?.accessToken,
        );

        options.headers.set(
          'Authorization',
          `Bearer ${data.value?.accessToken}`,
        );
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        // TODO: move retry here
        console.log('🚀 ~ onResponseError ~ response:', response);
      }
    },
  });

  // Expose to useNuxtApp().$geinsApi
  return {
    provide: {
      geinsApi,
    },
  };
});
