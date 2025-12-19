import { repo } from '@/utils/repos';

interface UseGeinsRepositoryReturnType {
  globalApi: ReturnType<typeof repo.global>;
  orderApi: ReturnType<typeof repo.order>;
  productApi: ReturnType<typeof repo.product>;
  wholesaleApi: ReturnType<typeof repo.wholesale>;
  customersApi: ReturnType<typeof repo.customers>;
  pricingApi: ReturnType<typeof repo.pricing>;
  userApi: ReturnType<typeof repo.user>;
  customerApi: ReturnType<typeof repo.customer>;
}

/**
 * Composable that provides pre-configured repository instances
 * with the Geins API client automatically injected.
 *
 * Creates repository instances for different domains (global, order, product, etc.)
 * that are ready to use with the current Geins API configuration.
 *
 * @returns {UseGeinsRepositoryReturnType} - An object containing configured repository instances
 * @property {object} globalApi - Global API repository for system-wide operations
 * @property {object} orderApi - Order API repository for order management
 * @property {object} productApi - Product API repository for product operations
 * @property {object} wholesaleApi - Wholesale API repository for wholesale operations (deprecated, use customersApi/pricingApi)
 * @property {object} customersApi - Customers API repository for customer account operations
 * @property {object} pricingApi - Pricing API repository for price list operations
 * @property {object} userApi - User API repository for user management
 * @property {object} customerApi - Customer API repository for customer operations
 */
export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  const { $geinsApi } = useNuxtApp();

  return {
    globalApi: repo.global($geinsApi),
    orderApi: repo.order($geinsApi),
    productApi: repo.product($geinsApi),
    wholesaleApi: repo.wholesale($geinsApi),
    customersApi: repo.customers($geinsApi),
    pricingApi: repo.pricing($geinsApi),
    userApi: repo.user($geinsApi),
    customerApi: repo.customer($geinsApi),
  };
}
