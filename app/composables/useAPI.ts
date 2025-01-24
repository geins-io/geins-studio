import type { UseFetchOptions } from '#app';
/**
 * Custom hook to make API requests using the `useFetch` function.
 *
 * @template T - The expected response type.
 * @param {string | (() => string)} url - The URL or a function that returns the URL for the API request.
 * @param {UseFetchOptions<T>} [options] - Optional configuration options for the fetch request.
 * @returns {ReturnType<typeof useFetch>} The result of the `useFetch` function.
 */
export function useAPI<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
): ReturnType<typeof useFetch> {
  return useFetch(url, {
    ...options,
    $fetch: useNuxtApp().$geinsApi as typeof $fetch,
  });
}
