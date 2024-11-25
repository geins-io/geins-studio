import type { UseFetchOptions } from 'nuxt/app';

export function useAPI<T>() {
  const isFetching = ref(false);

  const callAPI = async (url: string, options?: UseFetchOptions<T>) => {
    console.log('🚀 ~ callAPI ~ url:', url);

    isFetching.value = true;

    const apiUrl = `/api${url}`;

    const requestHeaders = useRequestHeaders(['cookie']) as HeadersInit;
    console.log('🚀 ~ callAPI ~ requestHeaders:', requestHeaders);

    const { data, error } = await useFetch(apiUrl, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        ...requestHeaders,
      },
    });

    isFetching.value = false;
    return { data, error };
  };

  return {
    callAPI,
    isFetching,
  };
}
