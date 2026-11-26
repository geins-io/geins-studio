<script setup lang="ts">
import type {
  DashboardQueueItem,
  DashboardWidgetInstance,
} from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import { DASHBOARD_LIST_LIMIT, FAILED_RUNS_LINK } from '@/lib/dashboard-data';
import { LucideWorkflow } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { failed, loading, error, refresh } = useDashboardExecutions();
const { formatRelativeDate } = useDate();

const items = computed(() =>
  failed.value.slice(0, DASHBOARD_LIST_LIMIT).map(
    (execution): DashboardQueueItem => ({
      id: execution.id,
      to: entityEditUrl('execution', execution.id),
      title: execution.workflowName || t('workflows.unknown'),
      meta: t('navigation.orchestrator'),
      aside: formatRelativeDate(execution.startTime),
      status: 'failed',
      statusLabel: t('workflow_builder.status_failed'),
    }),
  ),
);
</script>

<template>
  <DashboardWidget :instance="instance" :view-all="FAILED_RUNS_LINK">
    <DashboardQueue
      :items="items"
      :loading="loading"
      :error="error"
      :on-retry="refresh"
      entity-key="execution"
      :empty-icon="LucideWorkflow"
      :with-avatar="false"
    />
  </DashboardWidget>
</template>
