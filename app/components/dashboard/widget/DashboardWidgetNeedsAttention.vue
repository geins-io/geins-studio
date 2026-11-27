<script setup lang="ts">
import type { DashboardWidgetInstance } from '#shared/types';
import { DASHBOARD_ATTENTION_KEYS } from '@/lib/dashboard-data';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { entries, total } = useDashboardAttention(DASHBOARD_ATTENTION_KEYS);
</script>

<template>
  <DashboardWidget
    :instance="instance"
    :description="t('dashboards.widgets.needs_attention.header_description')"
    :badge="total"
  >
    <!-- The rows share the height left under the whole grid rows -->
    <div
      class="grid grow auto-rows-fr grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3"
    >
      <DashboardAttentionCard
        v-for="entry in entries"
        :key="entry.key"
        :entry="entry"
      />
    </div>
  </DashboardWidget>
</template>
