<script setup lang="ts">
import type {
  ExecutionLog,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import { formatDuration, formatTimestamp } from '#shared/utils/time';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

export interface ExecutionListItem {
  id: string;
  workflowName: string;
  workflowId: string;
  group: string;
  groupSlug: string | null;
  status: string;
  startTime: string;
  startTimeIso: string | null;
  endTime: string;
  durationFormatted: string;
  durationMs: number;
  errorCount: number;
  nodeCount: number;
  isTestRun: boolean;
}

type Entity = ExecutionLog;
type EntityList = ExecutionListItem;

const scope = 'pages/orchestrator/executions/list.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();
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

// ─── Period filter (from ?period=1h|24h|7d|30d) ────────────────────
const PERIOD_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const periodFilter = computed(() => {
  const p = route.query.period;
  return typeof p === 'string' && p in PERIOD_MS ? p : null;
});

const periodRange = computed(() => {
  if (!periodFilter.value) return null;
  const now = Date.now();
  return {
    startedAfter: new Date(now - PERIOD_MS[periodFilter.value]!).toISOString(),
    startedBefore: new Date(now).toISOString(),
  };
});

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: executions, error: executionError, refresh } = await useAsyncData<Entity[]>(
  'executions-list',
  () => orchestratorApi.execution.list({
    ...(workflowIdFilter.value ? { workflowId: workflowIdFilter.value } : {}),
    ...(periodRange.value ?? {}),
  }),
  {
    watch: [workflowIdFilter, periodFilter],
    // Opt out of Nuxt payload cache — always fetch fresh on mount
    getCachedData: () => undefined,
  },
);

const filteredWorkflowName = computed(() => {
  if (!workflowIdFilter.value) return null;
  const match = allData.value.find((item) => item.workflowId === workflowIdFilter.value);
  return match?.workflowName ?? null;
});

type ActiveFilter =
  | { type: 'group'; label: string }
  | { type: 'name'; label: string }
  | { type: 'workflow'; label: string }
  | { type: 'period'; label: string };

const activeFilters = computed<ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = [];
  if (workflowIdFilter.value) {
    filters.push({ type: 'workflow', label: filteredWorkflowName.value ?? workflowIdFilter.value });
  }
  if (groupFilter.value) {
    const label = groupFilter.value
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    filters.push({ type: 'group', label });
  }
  if (nameFilter.value) {
    filters.push({ type: 'name', label: nameFilter.value });
  }
  if (periodFilter.value) {
    filters.push({ type: 'period', label: `Last ${periodFilter.value}` });
  }
  return filters;
});

const hasFilters = computed(() => activeFilters.value.length > 0);
const filterLabel = computed(() => activeFilters.value.map((f) => f.label).join(' · '));

// Sync breadcrumb title with active filters (replace last segment on list page)
watch([hasFilters, filterLabel], () => {
  const base = t('navigation.executions');
  breadcrumbsStore.setCurrentTitle(
    hasFilters.value ? `${base} — ${filterLabel.value}` : base,
    true,
  );
}, { immediate: true });

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
      startTime: formatTimestamp(e.startTime),
      startTimeIso: e.startTime ?? null,
      endTime: formatTimestamp(e.endTime ?? undefined),
      durationFormatted: formatDuration(e.durationMs ?? undefined),
      durationMs: e.durationMs ?? 0,
      errorCount: e.errorCount ?? 0,
      nodeCount: e.nodeExecutions?.length ?? 0,
      isTestRun: e.isTestRun ?? false,
    };
  });
};

// ─── Live ticking clock for running executions ────────────────────
const hasRunning = computed(() => allData.value.some((item) => item.status === 'running'));
const { now } = useLiveClock(hasRunning);

const applyLiveDuration = (item: EntityList): EntityList => {
  if (item.status !== 'running' || !item.startTimeIso) return item;
  const started = new Date(item.startTimeIso).getTime();
  if (Number.isNaN(started)) return item;
  const liveMs = now.value - started;
  return {
    ...item,
    durationMs: liveMs,
    durationFormatted: formatDuration(liveMs),
  };
};

// ─── Filtered Data (applies group or name filter) ──────────────────
const dataList = computed(() => {
  let list = allData.value;
  if (groupFilter.value) {
    list = list.filter((item) => item.groupSlug === groupFilter.value);
  }
  else if (nameFilter.value) {
    list = list.filter((item) => item.workflowName === nameFilter.value);
  }
  return list.map(applyLiveDuration);
});

const clearFilter = () => {
  navigateTo('/orchestrator/executions/list');
};

const FILTER_QUERY_KEY: Record<ActiveFilter['type'], string> = {
  workflow: 'id',
  group: 'group',
  name: 'name',
  period: 'period',
};

const removeFilter = (type: ActiveFilter['type']) => {
  const { [FILTER_QUERY_KEY[type]]: _, ...rest } = route.query;
  navigateTo({ path: '/orchestrator/executions/list', query: rest });
};

// ─── Live polling for new executions ───────────────────────────────
const POLL_INTERVAL_MS = 15_000;
const lastPollAt = ref<string>(new Date().toISOString());
let pollTimer: ReturnType<typeof setInterval> | null = null;

const pollNewExecutions = async () => {
  if (periodFilter.value) return;
  try {
    const since = lastPollAt.value;
    lastPollAt.value = new Date().toISOString();
    const fresh = await orchestratorApi.execution.list({
      startedAfter: since,
      ...(workflowIdFilter.value ? { workflowId: workflowIdFilter.value } : {}),
    });
    if (!Array.isArray(fresh) || fresh.length === 0) return;

    const mapped = mapToListData(fresh);
    const existingIds = new Set(allData.value.map((item) => item.id));
    const newRows = mapped.filter((row) => !existingIds.has(row.id));
    if (newRows.length === 0) return;

    allData.value = [...newRows, ...allData.value];
  }
  catch {
    // silent poll failure — next tick will retry
  }
};

const startPolling = () => {
  if (pollTimer) return;
  pollTimer = setInterval(pollNewExecutions, POLL_INTERVAL_MS);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
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

  const { resolveStatusIcon: resolveByStatus } = useExecutionStatus();
  const resolveStatusIcon = (row: EntityList) => resolveByStatus(row.status);

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      id: 'link',
      workflowName: 'link',
      status: 'icon',
    },
    linkColumns: {
      id: {
        url: '/orchestrator/executions/{id}',
        idField: 'id',
        maxTextLength: 24,
      },
      workflowName: { url: '/orchestrator/workflows/{id}', idField: 'workflowId' },
    },
    iconColumns: {
      status: {
        resolveIcon: resolveStatusIcon,
        url: '/orchestrator/executions/{id}',
        idField: 'id',
      },
    },
    columnTitles: {
      id: t('executions.id'),
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
  startPolling();
});

onBeforeUnmount(stopPolling);

// ─── Column Visibility ────────────────────────────────────────────
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['groupSlug', 'workflowId', 'isTestRun', 'endTime', 'startTimeIso'];
visibilityState.value = getVisibilityState(hiddenColumns);

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = ['workflowName', 'group', 'status'];
</script>

<template>
  <ContentHeader :title="hasFilters ? `${$t('navigation.executions')} — ${filterLabel}` : $t('navigation.executions')"
    :description="$t('executions.description')" />

  <!-- Active Filter Banner -->
  <div v-if="hasFilters" class="bg-muted/50 mb-4 flex items-center justify-between rounded-lg border px-4 py-2">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <LucideFilter class="text-muted-foreground h-4 w-4" />
      <span class="text-muted-foreground">Filtered by:</span>
      <span v-for="f in activeFilters" :key="f.type"
        class="bg-background inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 text-xs">
        <span class="text-muted-foreground">{{ f.type }}:</span>
        <span class="font-medium">{{ f.label }}</span>
        <button class="hover:bg-muted text-muted-foreground hover:text-foreground ml-0.5 rounded-full p-0.5"
          :title="`Remove ${f.type} filter`" @click="removeFilter(f.type)">
          <LucideX class="h-3 w-3" />
        </button>
      </span>
    </div>
    <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearFilter">
      <LucideX class="mr-1 h-3 w-3" />
      Clear filters
    </Button>
  </div>

  <NuxtErrorBoundary>
    <TableView :loading="loading" :entity-name="entityName" :columns="columns" :data="dataList"
      :init-visibility-state="visibilityState" :searchable-fields="searchableFields" :error="fetchError"
      :on-retry="refresh" />
  </NuxtErrorBoundary>
</template>
