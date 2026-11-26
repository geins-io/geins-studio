import type { ExecutionLog } from '#shared/types';
import { FAILED_RUNS_WITHIN_MS, failedExecutions } from '@/lib/dashboard-data';

interface UseDashboardExecutionsReturnType {
  failed: ComputedRef<ExecutionLog[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<boolean>;
  refresh: () => Promise<void>;
}

/**
 * The workflow runs in Orchestrator that failed in the last 24 hours, for the
 * start dashboard. One fetch, shared by every widget through its
 * `useAsyncData` key. Always the whole account as it is now; the dashboard's
 * period and Channel / Market don't apply.
 *
 * @returns {UseDashboardExecutionsReturnType} - The failed runs and the fetch state
 * @property {ComputedRef<ExecutionLog[]>} failed - Failed runs started in the last 24 hours, newest first
 * @property {ComputedRef<boolean>} loading - Whether the runs are being fetched
 * @property {ComputedRef<boolean>} error - Whether the fetch failed
 * @property {function} refresh - Fetches the runs again
 */
export const useDashboardExecutions = (): UseDashboardExecutionsReturnType => {
  const { orchestratorApi } = useGeinsRepository();

  // A GET, so a failure never raises the global error toast; the widget shows it
  const { data, status, refresh } = useAsyncData(
    'dashboard-failed-executions',
    async () => {
      const now = new Date();
      const items = await orchestratorApi.execution.list({
        status: 'Failed',
        startedAfter: new Date(
          now.getTime() - FAILED_RUNS_WITHIN_MS,
        ).toISOString(),
      });
      return failedExecutions(Array.isArray(items) ? items : [], now);
    },
    // A widget set up while another's fetch is in flight joins it; the
    // default ('cancel') would abort it and send the request again
    { dedupe: 'defer' },
  );

  return {
    failed: computed(() => data.value ?? []),
    loading: computed(() => status.value === 'pending'),
    error: computed(() => status.value === 'error'),
    refresh,
  };
};
