import type { UseFetchOptions } from 'nuxt/app';

export function useAPI<T>() {
  const isFetching = ref(false);

  const callAPI = async (url: string, options?: UseFetchOptions<T>) => {
    isFetching.value = true;

    const apiUrl = `/api${url}`;

    const requestHeaders = useRequestHeaders(['cookie']) as HeadersInit;

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
