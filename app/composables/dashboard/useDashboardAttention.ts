import type {
  DashboardAttentionDefinition,
  DashboardAttentionEntry,
  DashboardAttentionKey,
} from '@/lib/dashboard-data';
import { DASHBOARD_ATTENTION } from '@/lib/dashboard-data';

interface UseDashboardAttentionReturnType {
  entries: ComputedRef<DashboardAttentionEntry[]>;
  /** The numbers added up, once each has loaded; `undefined` until then or on an error */
  total: ComputedRef<number | undefined>;
}

/**
 * The Needs attention numbers `keys` asks for, each with its own fetch state,
 * from [useDashboardQuotations] and [useDashboardExecutions]. Only the
 * fetches those numbers need are made, so a single failed-runs tile doesn't
 * load every quotation.
 *
 * @param {DashboardAttentionKey[]} keys - The numbers, in display order
 * @returns {UseDashboardAttentionReturnType} - The numbers and their total
 * @property {ComputedRef<DashboardAttentionEntry[]>} entries - Each number with its definition, count and fetch state
 * @property {ComputedRef<number | undefined>} total - The numbers added up once all have loaded
 */
export const useDashboardAttention = (
  keys: DashboardAttentionKey[],
): UseDashboardAttentionReturnType => {
  const needs = (source: DashboardAttentionDefinition['source']) =>
    keys.some((key) => DASHBOARD_ATTENTION[key].source === source);
  const quotations = needs('quotations') ? useDashboardQuotations() : null;
  const executions = needs('executions') ? useDashboardExecutions() : null;

  const entries = computed(() =>
    keys.flatMap((key): DashboardAttentionEntry[] => {
      const definition = DASHBOARD_ATTENTION[key];
      const source =
        definition.source === 'quotations' ? quotations : executions;
      if (!source) return [];
      const count =
        key === 'requests'
          ? (quotations?.requests.value.length ?? 0)
          : key === 'expiring'
            ? (quotations?.expiring.value.length ?? 0)
            : (executions?.failed.value.length ?? 0);
      return [
        {
          ...definition,
          count,
          loading: source.loading.value,
          error: source.error.value,
          retry: source.refresh,
        },
      ];
    }),
  );

  const total = computed(() =>
    entries.value.some((entry) => entry.loading || entry.error)
      ? undefined
      : entries.value.reduce((sum, entry) => sum + entry.count, 0),
  );

  return { entries, total };
};
