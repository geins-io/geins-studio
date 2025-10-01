import { repo } from '@/utils/repos';

/**
 * Composable that provides pre-configured repository instances
 * with the Geins API client automatically injected
 */
export function useGeinsRepository() {
  const { $geinsApi } = useNuxtApp();

  return {
    globalApi: repo.global($geinsApi),
    orderApi: repo.order($geinsApi),
    productApi: repo.product($geinsApi),
    wholesaleApi: repo.wholesale($geinsApi),
    userApi: repo.user($geinsApi),
    customerApi: repo.customer($geinsApi),
  };
}
