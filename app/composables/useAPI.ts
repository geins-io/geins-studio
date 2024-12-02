import type { UseFetchOptions } from '#app';

export function useAPI<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
): ReturnType<typeof useFetch> {
  return useFetch(url, {
    ...options,
    $fetch: useNuxtApp().$geinsApi as typeof $fetch,
  });
}
