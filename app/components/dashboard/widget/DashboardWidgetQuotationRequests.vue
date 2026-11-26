<script setup lang="ts">
import type {
  DashboardQueueItem,
  DashboardWidgetInstance,
} from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import {
  DASHBOARD_LIST_LIMIT,
  QUOTATION_REQUESTS_LINK,
  requestedAt,
} from '@/lib/dashboard-data';
import { LucideInbox } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { requests, loading, error, refresh } = useDashboardQuotations({
  scoped: true,
});
const { formatRelativeDate } = useDate();

const items = computed(() =>
  requests.value.slice(0, DASHBOARD_LIST_LIMIT).map(
    (quotation): DashboardQueueItem => ({
      id: quotation._id,
      to: entityEditUrl('quotation', quotation._id),
      title: quotation.company?.name || quotation.name,
      avatar: quotation.company?.name || quotation.name,
      meta: quotation.quotationNumber,
      aside: formatRelativeDate(requestedAt(quotation)),
      status: 'requested',
    }),
  ),
);
</script>

<template>
  <DashboardWidget :instance="instance" :view-all="QUOTATION_REQUESTS_LINK">
    <DashboardQueue
      :items="items"
      :loading="loading"
      :error="error"
      :on-retry="refresh"
      entity-key="quotation"
      :empty-icon="LucideInbox"
    />
  </DashboardWidget>
</template>
