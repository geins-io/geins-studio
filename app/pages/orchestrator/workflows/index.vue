<script setup lang="ts">
import cronstrue from 'cronstrue';
import 'cronstrue/locales/sv';
import type {
  WorkflowSummary,
  WorkflowMetrics,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import type { Component } from 'vue';
import {
  LucideClock,
  LucideZap,
  LucidePlay,
  LucideCircleCheck,
  LucideCircleAlert,
  LucideCircleX,
} from '#components';

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  type: string;
  triggerSummary: string;
  nodeCount: number;
  health: string;
  status: string;
  group: string;
  groupSlug: string | null;
  executionsTotal: number | string;
  executions24h: number | string;
  executions7d: number | string;
  executions30d: number | string;
  successRateTotal: string;
  successRate24h: string;
  successRate7d: string;
  successRate30d: string;
}

type Entity = WorkflowSummary;
type EntityList = WorkflowListItem;

const scope = 'pages/orchestrator/workflows.vue';
const { t, locale } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const allData = ref<EntityList[]>([]);
const entityName = 'workflow';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entityName, entityList: true, scope });
const fetchError = ref(false);

// ─── Filters (from query string) ───────────────────────────────────
const groupFilter = computed(() => {
  const g = route.query.group;
  return typeof g === 'string' && g.length > 0 ? g : null;
});

const nameFilter = computed(() => {
  const n = route.query.name;
  return typeof n === 'string' && n.length > 0 ? n : null;
});

const activeFilter = computed(() => {
  if (groupFilter.value) {
    // Convert slug back to display name: "order-sync" → "Order Sync"
    const label = groupFilter.value
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { type: 'group' as const, label };
  }
  if (nameFilter.value) {
    return { type: 'name' as const, label: nameFilter.value };
  }
  return null;
});

const groupLabel = computed(() => activeFilter.value?.label ?? '');

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
const cronToHuman = (cron: string): string => {
  try {
    return cronstrue.toString(cron, { locale: locale.value, use24HourTimeFormat: true });
  }
  catch {
    return cron;
  }
};

const deriveTriggerSummary = (wf: WorkflowSummary): string => {
  if (wf.cronExpression) return cronToHuman(wf.cronExpression);
  if (wf.type === 'event') return wf.eventName ? t(`workflows.events.${wf.eventName}`) : t('workflows.event');
  if (wf.type === 'scheduled') {
    return wf.cronExpression ? cronToHuman(wf.cronExpression) : t('workflows.scheduled');
  }
  if (wf.type === 'onDemand') return t('workflows.trigger_manual');
  return String(wf.type || t('workflows.trigger_manual'));
};

const formatRate = (rate: number | undefined, executions: number | undefined): string => {
  if (!executions) return '–';
  return `${(rate ?? 0).toFixed(1)}%`;
};

const mapToListData = (
  list: WorkflowSummary[],
  metricsList: WorkflowMetrics[],
): EntityList[] => {
  const metricsMap = new Map(metricsList.map((m) => [m.id, m]));

  return list.map((wf) => {
    const wfMetrics = metricsMap.get(wf.id);
    const groupName = wf.group ?? '';

    let displayType = String(wf.type || 'onDemand');
    displayType = displayType.charAt(0).toUpperCase() + displayType.slice(1);

    return {
      id: wf.id,
      name: wf.name || 'Unknown',
      description: wf.description ?? '',
      type: displayType,
      triggerSummary: deriveTriggerSummary(wf),
      nodeCount: wf.nodeCount || 0,
      health: wfMetrics?.status?.health ?? 'Unknown',
      status: wf.enabled ? 'enabled' : 'idle',
      executionsTotal: wfMetrics?.metricsAllTime?.totalExecutions || '–',
      executions24h: wfMetrics?.metrics24h?.totalExecutions || '–',
      executions7d: wfMetrics?.metrics7d?.totalExecutions || '–',
      executions30d: wfMetrics?.metrics30d?.totalExecutions || '–',
      successRateTotal: formatRate(wfMetrics?.metricsAllTime?.successRate, wfMetrics?.metricsAllTime?.totalExecutions),
      successRate24h: formatRate(wfMetrics?.metrics24h?.successRate, wfMetrics?.metrics24h?.totalExecutions),
      successRate7d: formatRate(wfMetrics?.metrics7d?.successRate, wfMetrics?.metrics7d?.totalExecutions),
      successRate30d: formatRate(wfMetrics?.metrics30d?.successRate, wfMetrics?.metrics30d?.totalExecutions),

      group: groupName,
      groupSlug: groupName ? groupName.toLowerCase().replace(/\s+/g, '-') : null,
    };
  });
};

// ─── Filtered Data (applies group or name filter) ──────────────────
const dataList = computed(() => {
  if (groupFilter.value) {
    return allData.value.filter((item) => item.groupSlug === groupFilter.value);
  }
  if (nameFilter.value) {
    return allData.value.filter((item) => item.name === nameFilter.value);
  }
  return allData.value;
});

const clearGroupFilter = () => {
  navigateTo('/orchestrator/workflows');
};

// ─── Table Columns ─────────────────────────────────────────────────
const { getColumns } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [workflows, workflowError, metrics],
    ([newData, newError, newMetrics]) => {
      if (newError) {
        fetchError.value = true;
        allData.value = [];
        return;
      }
      fetchError.value = false;
      const safeData: WorkflowSummary[] = Array.isArray(newData) ? newData : [];
      allData.value = mapToListData(safeData, newMetrics || []);
    },
    { immediate: true },
  );

  const triggerIconMap: Record<string, Component> = {
    scheduled: LucideClock,
    event: LucideZap,
    onDemand: LucidePlay,
  };

  const resolveTriggerIcon = (row: EntityList) => {
    const type = row.type?.toLowerCase() || 'ondemand';
    const icon = triggerIconMap[type] || LucidePlay;
    return { icon, class: 'text-muted-foreground' };
  };

  const resolveRateIcon = (row: EntityList, field: keyof EntityList) => {
    const val = String(row[field] ?? '');
    if (val === '–' || !val) return undefined;
    const rate = parseFloat(val);
    if (Number.isNaN(rate)) return undefined;
    if (rate > 99) return { icon: LucideCircleCheck, class: 'text-green-500' };
    if (rate >= 80) return { icon: LucideCircleAlert, class: 'text-yellow-500' };
    return { icon: LucideCircleX, class: 'text-destructive' };
  };

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      name: 'link',
      triggerSummary: 'icon',
      health: 'status',
      status: 'status',
      executionsTotal: 'link',
      executions24h: 'link',
      executions7d: 'link',
      executions30d: 'link',
      successRateTotal: 'icon',
      successRate24h: 'icon',
      successRate7d: 'icon',
      successRate30d: 'icon',
    },
    linkColumns: {
      name: { url: '/orchestrator/workflows/{id}', idField: 'id' },
      executionsTotal: { url: '/orchestrator/executions?id={id}', idField: 'id' },
      executions24h: { url: '/orchestrator/executions?id={id}&period=24h', idField: 'id' },
      executions7d: { url: '/orchestrator/executions?id={id}&period=7d', idField: 'id' },
      executions30d: { url: '/orchestrator/executions?id={id}&period=30d', idField: 'id' },
    },
    iconColumns: {
      triggerSummary: { resolveIcon: resolveTriggerIcon },
      successRateTotal: { resolveIcon: (row) => resolveRateIcon(row, 'successRateTotal') },
      successRate24h: { resolveIcon: (row) => resolveRateIcon(row, 'successRate24h') },
      successRate7d: { resolveIcon: (row) => resolveRateIcon(row, 'successRate7d') },
      successRate30d: { resolveIcon: (row) => resolveRateIcon(row, 'successRate30d') },
    },
    columnTitles: {
      name: t('name'),
      description: t('workflows.table_description'),
      type: t('workflows.type'),
      triggerSummary: t('workflows.trigger'),
      nodeCount: t('workflows.node_count'),
      health: t('workflows.health'),
      status: t('status'),
      group: t('workflows.group'),
      executionsTotal: t('workflows.total_executions'),
      executions24h: t('workflows.executions_24h'),
      executions7d: t('workflows.executions_7d'),
      executions30d: t('workflows.executions_30d'),
      successRateTotal: t('workflows.success_rate_total'),
      successRate24h: t('workflows.success_rate_24h'),
      successRate7d: t('workflows.success_rate_7d'),
      successRate30d: t('workflows.success_rate_30d'),
    },
    excludeColumns: [],
  };



  columns.value = getColumns(dataList.value, columnOptions);
  loading.value = false;
});

// ─── Column Visibility ────────────────────────────────────────────
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['id', 'description', 'groupSlug'];
visibilityState.value = getVisibilityState(hiddenColumns);

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = ['name', 'type', 'health', 'status', 'group', 'triggerSummary'];
</script>

<template>
  <ContentHeader :title="activeFilter ? groupLabel : $t('navigation.workflows')"
    :description="$t('workflows.description')">
    <ContentActionBar>
      <ButtonIcon icon="new" href="/orchestrator/workflows/new">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <!-- Active Filter Banner -->
  <div v-if="activeFilter" class="bg-muted/50 mb-4 flex items-center justify-between rounded-lg border px-4 py-2">
    <div class="flex items-center gap-2 text-sm">
      <LucideFilter class="text-muted-foreground h-4 w-4" />
      <span class="text-muted-foreground">Filtered by {{ activeFilter.type }}:</span>
      <span class="font-medium">{{ activeFilter.label }}</span>
    </div>
    <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearGroupFilter">
      <LucideX class="mr-1 h-3 w-3" />
      Clear filter
    </Button>
  </div>

  <NuxtErrorBoundary>
    <TableView :loading="loading" :entity-name="entityName" :columns="columns" :data="dataList"
      :init-visibility-state="visibilityState" :searchable-fields="searchableFields" :error="fetchError"
      :on-retry="refresh">
      <template #empty-actions>
        <ButtonIcon icon="new" variant="secondary" @click="navigateTo('/orchestrator/workflows/new')">
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
