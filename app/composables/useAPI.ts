import type { UseFetchOptions } from 'nuxt/app';

export function useAPI<T>() {
  const isLoading = ref(false);
  const callAPI = async (url: string, options: UseFetchOptions<T>) => {
    isLoading.value = true;

    // Construct the full URL
    const fullUrl = new URL(url, useRuntimeConfig().public.apiBase as string);

    // Prepare headers
    const headers: Record<string, string> = {
      'x-account-key': useRuntimeConfig().public.accountKey as string,
    };

    // Add Authorization header if access token is available
    const { data: authData, status } = useAuth();
    if (status.value === 'authenticated') {
      headers['Authorization'] = `Bearer ${authData.value?.accessToken}`;
    }

    const { data, error } = await useFetch(fullUrl.toString(), {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });
    isLoading.value = false;
    return { data, error };
  };

  return {
    callAPI,
    isLoading,
  };
}
