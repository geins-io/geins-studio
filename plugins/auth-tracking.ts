export default defineNuxtPlugin({
  name: 'auth-tracking',
  enforce: 'post', // Run after auth plugin
  setup(nuxtApp) {
    const auth = useAuth();

    // Get the Application Insights instance
    const appInsights = nuxtApp.$appInsights;

    if (!appInsights) {
      console.warn('Application Insights not available');
      return;
    }

    watch(
      () => auth.status.value,
      (newStatus, oldStatus) => {
        if (newStatus !== oldStatus && import.meta.client) {
          console.log({
            name: 'AuthStatusChange',
            properties: {
              from: oldStatus,
              to: newStatus,
              timestamp: new Date().toISOString(),
            },
          });
        }
      },
    );

    // Track when authentication requests are made
    nuxtApp.hook('page:start', () => {
      const route = useRoute();
      if (route.path.startsWith('/auth/') && import.meta.client) {
        console.log({
          name: 'AuthPageVisit',
          properties: {
            path: route.path,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

    // Add custom error tracking for auth errors
    nuxtApp.hook('vue:error', (err) => {
      if (
        err &&
        err.message &&
        err.message.includes('AUTH_ERROR') &&
        import.meta.client
      ) {
        console.log({
          exception: err,
          properties: {
            message: err.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
  },
});
