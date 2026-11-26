<script setup lang="ts">
import type {
  DashboardQueueItem,
  DashboardWidgetInstance,
} from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import {
  DASHBOARD_LIST_LIMIT,
  EXPIRING_QUOTATIONS_LINK,
  calendarDaysUntil,
} from '@/lib/dashboard-data';
import { LucideClock } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { expiring, loading, error, refresh } = useDashboardQuotations({
  scoped: true,
});
const { formatRelativeDays } = useDate();
const { formatCurrency } = usePrice();

const items = computed(() => {
  const now = new Date();
  return expiring.value
    .slice(0, DASHBOARD_LIST_LIMIT)
    .map((quotation): DashboardQueueItem => {
      const total = formatCurrency(quotation.total?.grandTotalExVat);
      const days = calendarDaysUntil(quotation.validTo, now) ?? 0;
      return {
        id: quotation._id,
        to: entityEditUrl('quotation', quotation._id),
        title: quotation.company?.name || quotation.name,
        avatar: quotation.company?.name || quotation.name,
        meta: total
          ? `${quotation.quotationNumber} · ${total} ${quotation.currency}`
          : quotation.quotationNumber,
        aside: t('dashboards.expires', { when: formatRelativeDays(days) }),
      };
    });
});
</script>

<template>
  <DashboardWidget :instance="instance" :view-all="EXPIRING_QUOTATIONS_LINK">
    <DashboardQueue
      :items="items"
      :loading="loading"
      :error="error"
      :on-retry="refresh"
      entity-key="quotation"
      :empty-icon="LucideClock"
    />
  </DashboardWidget>
</template>
