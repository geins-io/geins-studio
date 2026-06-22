import type { GeinsApiFetch } from '#shared/types';

interface UseGeinsApiReturnType {
  geinsFetch: GeinsApiFetch;
}

/**
 * Custom hook to make API requests using the Geins API.
 *
 * Use this for ad-hoc queries that don't fit into a specific repository,
 * or as a foundation for more specific API composables.
 *
 * @returns {UseGeinsApiReturnType} - An object containing methods to interact with the API.
 * @property {function} geinsFetch - Wrapper around $fetch to directly fetch data from the Geins API using.
 */
export const useGeinsApi = (): UseGeinsApiReturnType => {
  const { $geinsApi } = useNuxtApp();

  return {
    geinsFetch: $geinsApi,
  };
};
