import type { UseFetchOptions } from '#app';

export function useAPI<T>() {
  const isFetching = ref(false);
  const auth = useAuth();

  const callAPI = async (url: string, options?: UseFetchOptions<T>) => {
    console.log('🚀 ~ callAPI ~ url:', url);

    isFetching.value = true;

    const apiUrl = `/api${url}`;

    const refreshCookie = useCookie('auth-refresh');
    console.log('🪲🪲🪲 ~ callAPI ~ refreshCookie:', refreshCookie.value);

    const requestHeaders = useRequestHeaders(['cookie']) as HeadersInit;

    const session = await auth.getSession();
    const token = session?.accessToken;
    console.log('🪲🪲🪲 ~ callAPI ~ accessToken:', token);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : null;

    const headers = {
      ...options?.headers,
      ...requestHeaders,
      ...authHeader,
    };

    try {
      const { data, error } = await useFetch(apiUrl, {
        ...options,
        method: options?.method || 'GET',
        headers,
      });
      return { data, error };
    } catch (error) {
      console.error('🪲🪲🪲 ~ callAPI ~ error:', error);
      return { data: null, error };
    } finally {
      isFetching.value = false;
    }
  };

  return {
    callAPI,
    isFetching,
  };
}
