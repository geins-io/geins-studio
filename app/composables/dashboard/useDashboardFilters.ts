import type { DashboardPeriod, DashboardPeriodPreset } from '#shared/types';
import {
  dashboardCurrency,
  endOfDay,
  presetRange,
  pruneDashboardMarkets,
  startOfDay,
} from '@/lib/dashboard';
import type { ComputedRef, InjectionKey } from 'vue';

export interface UseDashboardFiltersReturnType {
  period: ComputedRef<DashboardPeriod>;
  channelIds: ComputedRef<string[]>;
  marketIds: ComputedRef<string[]>;
  currency: ComputedRef<string>;
  setPeriodPreset: (preset: DashboardPeriodPreset) => void;
  setCustomPeriod: (from: Date, to: Date) => void;
  setChannelIds: (ids: string[]) => void;
  setMarketIds: (ids: string[]) => void;
}

const DASHBOARD_FILTERS: InjectionKey<UseDashboardFiltersReturnType> =
  Symbol('dashboard-filters');

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * The start dashboard's filters: the period, and the channels and markets the
 * widgets show (none picked = all). The page's call creates the state and
 * provides it; every call below the page (the filter bar, the widgets) gets
 * that same state. Nothing is saved: a reload starts at Today and all.
 *
 * @returns {UseDashboardFiltersReturnType} - The filter state and its setters
 * @property {ComputedRef<DashboardPeriod>} period - The picked period as local dates; presets follow the clock past midnight
 * @property {ComputedRef<string[]>} channelIds - Picked channel ids, empty for all
 * @property {ComputedRef<string[]>} marketIds - Picked market ids, empty for all
 * @property {ComputedRef<string>} currency - The picked markets' currency, else the first channel in scope's default currency
 * @property {function} setPeriodPreset - Picks a preset period
 * @property {function} setCustomPeriod - Picks a custom period, whole days from `from` to `to`
 * @property {function} setChannelIds - Picks channels and drops picked markets they don't have
 * @property {function} setMarketIds - Picks markets, only ones the channels in scope have
 */
export const useDashboardFilters = (): UseDashboardFiltersReturnType => {
  const provided = inject(DASHBOARD_FILTERS, null);
  if (provided) return provided;
  const filters = createDashboardFilters();
  provide(DASHBOARD_FILTERS, filters);
  return filters;
};

function createDashboardFilters(): UseDashboardFiltersReturnType {
  const { account, channels, currentCurrency } = storeToRefs(useAccountStore());

  // `today` only changes at midnight, so presets move to the new day without
  // handing the widgets a new period every minute
  const { now } = useLiveClock(true, 60_000);
  const today = computed(() => startOfDay(new Date(now.value)).getTime());

  const selection = shallowRef<
    DashboardPeriodPreset | { from: Date; to: Date }
  >('today');
  const period = computed<DashboardPeriod>(() => {
    const picked = selection.value;
    return typeof picked === 'string'
      ? { preset: picked, ...presetRange(picked, new Date(today.value)) }
      : { preset: 'custom', ...picked };
  });

  const setPeriodPreset = (preset: DashboardPeriodPreset) => {
    selection.value = preset;
  };
  const setCustomPeriod = (from: Date, to: Date) => {
    const [first, last] = from <= to ? [from, to] : [to, from];
    selection.value = { from: startOfDay(first), to: endOfDay(last) };
  };

  const channelIds = ref<string[]>([]);
  const marketIds = ref<string[]>([]);

  // Only real changes are written, so widgets don't refetch on a no-op
  const setMarketIds = (ids: string[]) => {
    const next = pruneDashboardMarkets(channels.value, channelIds.value, ids);
    if (!sameIds(next, marketIds.value)) marketIds.value = next;
  };
  const setChannelIds = (ids: string[]) => {
    if (!sameIds(ids, channelIds.value)) channelIds.value = [...ids];
    setMarketIds(marketIds.value);
  };

  // Another account's channels: drop picks it doesn't have
  watch(channels, (list) => {
    const known = new Set(list.map((channel) => channel._id));
    setChannelIds(channelIds.value.filter((id) => known.has(id)));
  });

  const currency = computed(
    () =>
      dashboardCurrency(channels.value, channelIds.value, marketIds.value) ??
      account.value?.defaultCurrency ??
      currentCurrency.value,
  );

  return {
    period,
    channelIds: computed(() => channelIds.value),
    marketIds: computed(() => marketIds.value),
    currency,
    setPeriodPreset,
    setCustomPeriod,
    setChannelIds,
    setMarketIds,
  };
}
