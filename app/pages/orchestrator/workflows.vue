<script setup lang="ts">
import type {
  WorkflowSummary,
  WorkflowMetrics,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  type: string;
  triggerSummary: string;
  nodeCount: number;
  health: string;
  enabled: boolean;
}

type Entity = WorkflowSummary;
type EntityList = WorkflowListItem;

const scope = 'pages/orchestrator/workflows.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const { orchestratorApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = 'workflow';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entityName, entityList: true, scope });
const fetchError = ref(false);

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: workflows, error: workflowError, refresh } = await useAsyncData<Entity[]>(
  'workflows-list',
  () => orchestratorApi.workflow.list(),
);

const { data: rawMetrics } = await useAsyncData(
  'workflows-metrics',
  () => orchestratorApi.metrics.list(),
);

// The metrics API may return { workflows: [...] } or a flat array
const metrics = computed<WorkflowMetrics[]>(() => {
  const raw = rawMetrics.value;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'workflows' in (raw as Record<string, unknown>)) {
    return (raw as unknown as { workflows: WorkflowMetrics[] }).workflows;
  }
  return [];
});

// ─── Data Mapping ──────────────────────────────────────────────────
const deriveTriggerSummary = (wf: Record<string, unknown>): string => {
  const trigger = wf.trigger as Record<string, unknown> | undefined;
  if (trigger?.cron) return String(trigger.cron);
  if (trigger?.eventFilters) return 'Event Filters';
  if (trigger?.type) return String(trigger.type);
  if (wf.type === 'event' || wf.type === 'Event') return 'Event Trigger';
  if (wf.type === 'scheduled' || wf.type === 'Scheduled') return 'Scheduled Trigger';
  if (wf.type === 'onDemand' || wf.type === 'OnDemand') return t('workflows.trigger_manual');
  return String(wf.type || t('workflows.trigger_manual'));
};

const mapToListData = (
  list: Record<string, unknown>[],
  metricsList: Record<string, unknown>[],
): EntityList[] => {
  const metricsMap = new Map(metricsList.map((m) => [m.workflowId, m]));

  return list.map((wf) => {
    const workflowId = String(wf._id || wf.id || wf.workflowId || '');
    const wfMetrics = metricsMap.get(workflowId) as Record<string, unknown> | undefined;
    const trigger = wf.trigger as Record<string, unknown> | undefined;

    let displayType = String(wf.type || trigger?.type || 'OnDemand');
    if (displayType) displayType = displayType.charAt(0).toUpperCase() + displayType.slice(1);

    return {
      id: workflowId,
      name: wf.name ? String(wf.name) : 'Unknown',
      description: wf.description ? String(wf.description) : '',
      type: displayType,
      triggerSummary: deriveTriggerSummary(wf),
      nodeCount: Number(wf.nodeCount || 0),
      health: wfMetrics?.healthStatus ? String(wfMetrics.healthStatus) : 'unknown',
      enabled: Boolean(trigger?.enabled ?? wf.enabled ?? true),
    };
  });
};

// ─── Table Columns ─────────────────────────────────────────────────
const { getColumns } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [workflows, workflowError, metrics],
    ([newData, newError, newMetrics]) => {
      if (newError) {
        fetchError.value = true;
        dataList.value = [];
        return;
      }
      fetchError.value = false;
      const safeData = Array.isArray(newData)
        ? newData
        : (newData && typeof newData === 'object' && Array.isArray((newData as Record<string, unknown>).workflows))
          ? (newData as Record<string, unknown>).workflows as Record<string, unknown>[]
          : [];
      dataList.value = mapToListData(
        safeData as Record<string, unknown>[],
        (newMetrics || []) as unknown as Record<string, unknown>[],
      );
    },
    { immediate: true },
  );

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      name: 'link',
      health: 'status',
      enabled: 'status',
    },
    linkColumns: {
      name: { url: '/orchestrator/workflows/{id}', idField: 'id' },
    },
    columnTitles: {
      name: t('name'),
      description: t('workflows.table_description'),
      type: t('workflows.type'),
      triggerSummary: t('workflows.trigger'),
      nodeCount: t('workflows.node_count'),
      health: t('workflows.health'),
      enabled: t('workflows.enabled'),
    },
    excludeColumns: [],
  };

  columns.value = getColumns(dataList.value, columnOptions);
  loading.value = false;
});

// ─── Column Visibility ────────────────────────────────────────────
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['id', 'description'];
visibilityState.value = getVisibilityState(hiddenColumns);
</script>

<template>
  <ContentHeader :title="$t('navigation.workflows')" :description="$t('workflows.description')">
    <ContentActionBar>
      <ButtonIcon icon="new" href="/orchestrator/workflows/new">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <NuxtErrorBoundary>
    <TableView :loading="loading" :entity-name="entityName" :columns="columns" :data="dataList"
      :init-visibility-state="visibilityState" :error="fetchError" :on-retry="refresh">
      <template #empty-actions>
        <ButtonIcon icon="new" variant="secondary" @click="navigateTo('/orchestrator/workflows/new')">
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
