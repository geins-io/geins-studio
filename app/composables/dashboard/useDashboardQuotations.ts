import type { Quotation } from '#shared/types';
import { withoutLinkedRevisionDrafts } from '#shared/utils/quotation';
import { inDashboardScope } from '@/lib/dashboard';
import { expiringQuotations, quotationRequests } from '@/lib/dashboard-data';

interface UseDashboardQuotationsReturnType {
  quotations: ComputedRef<Quotation[]>;
  requests: ComputedRef<Quotation[]>;
  expiring: ComputedRef<Quotation[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<boolean>;
  refresh: () => Promise<void>;
}

/**
 * The quotations the start dashboard's widgets read, fetched once for all of
 * them: every widget calls this, and the shared `useAsyncData` key makes it
 * one request (and one Retry). The list is the quotation list page's: request
 * drafts, revised versions and linked revision drafts left out.
 *
 * Always the account as it is now; the dashboard's period doesn't apply.
 * Expiring is counted from when the list was fetched. With `scoped`, only
 * quotations in the dashboard's picked channels and markets (the list
 * widgets); without it, the whole account (Needs attention).
 *
 * @param {object} [options]
 * @param {boolean} [options.scoped] - Follow the dashboard's Channel and Market filters
 * @returns {UseDashboardQuotationsReturnType} - The quotations and what's derived from them
 * @property {ComputedRef<Quotation[]>} quotations - Every quotation the list page shows
 * @property {ComputedRef<Quotation[]>} requests - Buyers' requests waiting for an answer, newest first
 * @property {ComputedRef<Quotation[]>} expiring - Pending quotations that expire within 7 days, soonest first
 * @property {ComputedRef<boolean>} loading - Whether the list is being fetched
 * @property {ComputedRef<boolean>} error - Whether the fetch failed
 * @property {function} refresh - Fetches the list again
 */
export const useDashboardQuotations = (
  options: { scoped?: boolean } = {},
): UseDashboardQuotationsReturnType => {
  const { orderApi } = useGeinsRepository();
  const filters = options.scoped ? useDashboardFilters() : null;

  // The widget shows a failed fetch itself, so no global error toast
  const { data, status, refresh } = useAsyncData(
    'dashboard-quotations',
    async () => {
      const result = await orderApi.quotation.list(
        undefined,
        { fields: ['company', 'revisions'] },
        { suppressErrorToast: true },
      );
      const items = Array.isArray(result?.items) ? result.items : [];
      return {
        items: withoutLinkedRevisionDrafts(items),
        fetchedAt: Date.now(),
      };
    },
    // A widget set up while another's fetch is in flight joins it; the
    // default ('cancel') would abort it and send the request again
    { dedupe: 'defer' },
  );

  const quotations = computed(() => {
    const items = data.value?.items ?? [];
    if (!filters) return items;
    const { channelIds, marketIds } = filters;
    return items.filter((quotation) =>
      inDashboardScope(quotation, channelIds.value, marketIds.value),
    );
  });
  const fetchedAt = computed(() => new Date(data.value?.fetchedAt ?? 0));

  return {
    quotations,
    requests: computed(() => quotationRequests(quotations.value)),
    expiring: computed(() =>
      expiringQuotations(quotations.value, fetchedAt.value),
    ),
    loading: computed(() => status.value === 'pending'),
    error: computed(() => status.value === 'error'),
    refresh,
  };
};
