<script setup lang="ts">
import type {
  ExecutionLog,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import type { Component } from 'vue';
import {
  LucidePlay,
  LucideCircleCheck,
  LucideCircleAlert,
  LucideCircleX,
  LucideLoader,
  LucideBan,
  LucideTimer,
  LucidePause,
} from '#components';

export interface ExecutionListItem {
  id: string;
  workflowName: string;
  workflowId: string;
  group: string;
  groupSlug: string | null;
  status: string;
  startTime: string;
  endTime: string;
  durationFormatted: string;
  durationMs: number;
  errorCount: number;
  nodeCount: number;
  isTestRun: boolean;
}

type Entity = ExecutionLog;
type EntityList = ExecutionListItem;

const scope = 'pages/orchestrator/executions.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const allData = ref<EntityList[]>([]);
const entityName = 'execution';
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

const workflowIdFilter = computed(() => {
  const id = route.query.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
});

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: executions, error: executionError, refresh } = await useAsyncData<Entity[]>(
  'executions-list',
  () => orchestratorApi.execution.list(
    workflowIdFilter.value ? { workflowId: workflowIdFilter.value } : undefined,
  ),
  { watch: [workflowIdFilter] },
);

const filteredWorkflowName = computed(() => {
  if (!workflowIdFilter.value) return null;
  const match = allData.value.find((item) => item.workflowId === workflowIdFilter.value);
  return match?.workflowName ?? null;
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
  if (workflowIdFilter.value) {
    return { type: 'workflow' as const, label: filteredWorkflowName.value ?? workflowIdFilter.value };
  }
  return null;
});

const groupLabel = computed(() => activeFilter.value?.label ?? '');

// ─── Helpers ───────────────────────────────────────────────────────
const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined || ms === null) return '–';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');

const formatTime = (iso: string | undefined): string => {
  if (!iso) return '–';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
};

// ─── Data Mapping ──────────────────────────────────────────────────
const mapToListData = (
  list: ExecutionLog[],
): EntityList[] => {
  return list.map((e) => {
    const groupName = e.group ?? '';

    return {
      id: e.id,
      workflowName: e.workflowName || 'Unknown',
      workflowId: e.workflowId,
      group: groupName,
      groupSlug: groupName ? groupName.toLowerCase().replace(/\s+/g, '-') : null,
      status: e.status?.toLowerCase() ?? 'unknown',
      startTime: formatTime(e.startTime),
      endTime: formatTime(e.endTime),
      durationFormatted: formatDuration(e.durationMs),
      durationMs: e.durationMs ?? 0,
      errorCount: e.errorCount ?? 0,
      nodeCount: e.nodeExecutions?.length ?? 0,
      isTestRun: e.isTestRun ?? false,
    };
  });
};

// ─── Filtered Data (applies group or name filter) ──────────────────
const dataList = computed(() => {
  if (groupFilter.value) {
    return allData.value.filter((item) => item.groupSlug === groupFilter.value);
  }
  if (nameFilter.value) {
    return allData.value.filter((item) => item.workflowName === nameFilter.value);
  }
  return allData.value;
});

const clearFilter = () => {
  navigateTo('/orchestrator/executions');
};

// ─── Table Columns ─────────────────────────────────────────────────
const { getColumns } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [executions, executionError],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        allData.value = [];
        return;
      }
      fetchError.value = false;
      const safeData: ExecutionLog[] = Array.isArray(newData) ? newData : [];
      allData.value = mapToListData(safeData);
    },
    { immediate: true },
  );

  const statusIconMap: Record<string, { icon: Component; class: string }> = {
    completed: { icon: LucideCircleCheck, class: 'text-green-500' },
    running: { icon: LucideLoader, class: 'text-blue-500 animate-spin' },
    failed: { icon: LucideCircleX, class: 'text-destructive' },
    canceled: { icon: LucideBan, class: 'text-muted-foreground' },
    cancelled: { icon: LucideBan, class: 'text-muted-foreground' },
    timedout: { icon: LucideTimer, class: 'text-yellow-500' },
    suspended: { icon: LucidePause, class: 'text-yellow-500' },
    pending: { icon: LucidePlay, class: 'text-muted-foreground' },
  };

  const resolveStatusIcon = (row: EntityList) => {
    const status = row.status?.toLowerCase() || 'unknown';
    return statusIconMap[status] ?? { icon: LucideCircleAlert, class: 'text-muted-foreground' };
  };

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      workflowName: 'link',
      status: 'icon',
    },
    linkColumns: {
      workflowName: { url: '/orchestrator/workflows/{id}', idField: 'workflowId' },
    },
    iconColumns: {
      status: { resolveIcon: resolveStatusIcon },
    },
    columnTitles: {
      workflowName: t('executions.workflow_name'),
      workflowId: t('executions.workflow_id'),
      group: t('workflows.group'),
      status: t('status'),
      startTime: t('executions.start_time'),
      endTime: t('executions.end_time'),
      durationFormatted: t('executions.duration'),
      errorCount: t('executions.errors'),
      nodeCount: t('executions.nodes'),
      isTestRun: t('executions.test_run'),
    },
    excludeColumns: ['durationMs'],
  };

  columns.value = getColumns(dataList.value, columnOptions);
  loading.value = false;
});

// ─── Column Visibility ────────────────────────────────────────────
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['id', 'groupSlug', 'workflowId', 'isTestRun', 'endTime'];
visibilityState.value = getVisibilityState(hiddenColumns);

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = ['workflowName', 'group', 'status'];
</script>

<template>
  <ContentHeader :title="activeFilter ? groupLabel : $t('navigation.executions')"
    :description="$t('executions.description')" />

  <!-- Active Filter Banner -->
  <div v-if="activeFilter" class="bg-muted/50 mb-4 flex items-center justify-between rounded-lg border px-4 py-2">
    <div class="flex items-center gap-2 text-sm">
      <LucideFilter class="text-muted-foreground h-4 w-4" />
      <span class="text-muted-foreground">Filtered by {{ activeFilter.type }}:</span>
      <span class="font-medium">{{ activeFilter.label }}</span>
    </div>
    <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearFilter">
      <LucideX class="mr-1 h-3 w-3" />
      Clear filter
    </Button>
  </div>

  <NuxtErrorBoundary>
    <TableView :loading="loading" :entity-name="entityName" :columns="columns" :data="dataList"
      :init-visibility-state="visibilityState" :searchable-fields="searchableFields" :error="fetchError"
      :on-retry="refresh" />
  </NuxtErrorBoundary>
</template>
