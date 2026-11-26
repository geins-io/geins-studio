<script setup lang="ts">
import type {
  DashboardScopeFilters,
  ListFilterMultiselectDefinition,
} from '#shared/types';
import { dashboardMarketsFor } from '@/lib/dashboard';

const accountStore = useAccountStore();
const { channels } = storeToRefs(accountStore);
const { channelIds, marketIds, setChannelIds, setMarketIds } =
  useDashboardFilters();

// The list pages' filter kit over the dashboard's own filter state. Channels
// are written first, so markets they don't have are dropped on the way.
const scope = computed<DashboardScopeFilters>({
  get: () => ({ channels: channelIds.value, markets: marketIds.value }),
  set: (next) => {
    setChannelIds(next.channels ?? []);
    setMarketIds(next.markets ?? []);
  },
});

const definitions = computed<
  ListFilterMultiselectDefinition<DashboardScopeFilters>[]
>(() => [
  {
    name: 'channels',
    label: 'channel',
    kind: 'multiselect',
    icon: 'Globe',
    options: channels.value.map((channel) => ({
      value: channel._id,
      label: channel.name || channel.identifier,
    })),
  },
  {
    name: 'markets',
    label: 'market',
    kind: 'multiselect',
    icon: 'MapPin',
    options: dashboardMarketsFor(channels.value, channelIds.value).map(
      (market) => ({
        value: market._id,
        label: accountStore.getMarketNameById(market._id),
      }),
    ),
  },
]);

const listFilters = useListFilters<DashboardScopeFilters>({
  definitions,
  filters: scope,
});
</script>

<template>
  <div
    class="@container mb-5 flex flex-wrap items-center gap-2"
    data-test="dashboard-filter-bar"
  >
    <DashboardPeriodBar />
    <ListFilterPinned
      v-for="definition in definitions"
      :key="definition.name"
      :definition="definition"
      :list-filters="listFilters"
    />
  </div>
</template>
