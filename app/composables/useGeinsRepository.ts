import { repo } from '@/utils/repos';

interface UseGeinsRepositoryReturnType {
  globalApi: ReturnType<typeof repo.global>;
  channelApi: ReturnType<typeof repo.channel>;
  orderApi: ReturnType<typeof repo.order>;
  productApi: ReturnType<typeof repo.product>;
  userApi: ReturnType<typeof repo.user>;
  customerApi: ReturnType<typeof repo.customer>;
  changelogApi: ReturnType<typeof repo.changelog>;
  orchestratorApi: ReturnType<typeof repo.orchestrator>;
  workflowApi: ReturnType<typeof repo.workflow>;
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
 * @property {object} userApi - User API repository for user management
 * @property {object} customerApi - Customer API repository for customer and account operations
 * @property {object} changelogApi - Changelog API repository for tracking and managing changes
 * @property {object} orchestratorApi - Orchestrator API repository for workflow and process management
 * @property {object} workflowApi - Workflow API repository for workflow and process management
 */
export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  const { $geinsApiFetchInstance } = useNuxtApp();

  return {
    globalApi: repo.global($geinsApiFetchInstance),
    channelApi: repo.channel($geinsApiFetchInstance),
    orderApi: repo.order($geinsApiFetchInstance),
    productApi: repo.product($geinsApiFetchInstance),
    userApi: repo.user($geinsApiFetchInstance),
    customerApi: repo.customer($geinsApiFetchInstance),
    changelogApi: repo.changelog($geinsApiFetchInstance),
    orchestratorApi: repo.orchestrator($geinsApiFetchInstance),
    workflowApi: repo.workflow($geinsApiFetchInstance),
  };
}
