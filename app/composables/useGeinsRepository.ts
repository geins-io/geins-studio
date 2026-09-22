import { repo } from '@/utils/repos';

interface UseGeinsRepositoryReturnType {
  accountApi: ReturnType<typeof repo.account>;
  assetApi: ReturnType<typeof repo.asset>;
  orderApi: ReturnType<typeof repo.order>;
  productApi: ReturnType<typeof repo.product>;
  userApi: ReturnType<typeof repo.user>;
  customerApi: ReturnType<typeof repo.customer>;
  changelogApi: ReturnType<typeof repo.changelog>;
  orchestratorApi: ReturnType<typeof repo.orchestrator>;
}

/**
 * Composable that provides pre-configured repository instances
 * with the Geins API client automatically injected.
 *
 * Creates repository instances for different domains (account, order, product, etc.)
 * that are ready to use with the current Geins API configuration.
 */
export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  const { $geinsApiFetchInstance } = useNuxtApp();

  return {
    accountApi: repo.account($geinsApiFetchInstance),
    assetApi: repo.asset($geinsApiFetchInstance),
    orderApi: repo.order($geinsApiFetchInstance),
    productApi: repo.product($geinsApiFetchInstance),
    userApi: repo.user($geinsApiFetchInstance),
    customerApi: repo.customer($geinsApiFetchInstance),
    changelogApi: repo.changelog($geinsApiFetchInstance),
    orchestratorApi: repo.orchestrator($geinsApiFetchInstance),
  };
}
