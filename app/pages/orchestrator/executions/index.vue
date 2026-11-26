<script setup lang="ts">
import type {
  ExecutionLog,
  ColumnOptions,
  ListFilterChip,
  StringKeyOf,
} from '#shared/types';
import { ENTITIES, entityListUrl } from '#shared/utils/entities';
import { formatDuration, formatTimestamp } from '#shared/utils/time';
import {
  EXECUTION_LIST_QUERY_KEYS,
  LIST_URL_PERIOD_MS,
  matchesExecutionStatus,
  parseExecutionListQuery,
} from '@/lib/list-url-filters';
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
  error: string;
  nodeCount: number;
  isTestRun: boolean;
}

type Entity = ExecutionLog;
type EntityList = ExecutionListItem;

const scope = 'pages/orchestrator/executions/index.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();
const allData = ref<EntityList[]>([]);
const entity = ENTITIES.execution;
const entityKey = entity.key;
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entity, entityList: true, scope });
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

// ─── Status + period filters (?status=failed&period=1h|24h|7d|30d) ──
const urlFilters = computed(() => parseExecutionListQuery(route.query));
const statusFilter = computed(() => urlFilters.value.statuses);
const periodFilter = computed(() => urlFilters.value.period);

const periodRange = computed(() => {
  if (!periodFilter.value) return null;
  const now = Date.now();
  return {
    startedAfter: new Date(
      now - LIST_URL_PERIOD_MS[periodFilter.value],
    ).toISOString(),
    startedBefore: new Date(now).toISOString(),
  };
});

// ─── Fetch Data ────────────────────────────────────────────────────
const {
  data: executions,
  error: executionError,
  refresh,
} = await useAsyncData<Entity[]>(
  'executions-list',
  () =>
    orchestratorApi.execution.list({
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
  const match = allData.value.find(
    (item) => item.workflowId === workflowIdFilter.value,
  );
  return match?.workflowName ?? null;
});

type ActiveFilter =
  | { type: 'group'; label: string }
  | { type: 'name'; label: string }
  | { type: 'workflow'; label: string }
  | { type: 'status'; label: string }
  | { type: 'period'; label: string };

const activeFilters = computed<ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = [];
  if (workflowIdFilter.value) {
    filters.push({
      type: 'workflow',
      label: filteredWorkflowName.value ?? workflowIdFilter.value,
    });
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
  if (statusFilter.value.length) {
    filters.push({
      type: 'status',
      label: statusFilter.value.map(statusBadgeLabel).join(', '),
    });
  }
  if (periodFilter.value) {
    filters.push({
      type: 'period',
      label: t('executions.period_last', { period: periodFilter.value }),
    });
  }
  return filters;
});

// Localized label for each filter-type tag prefix.
const filterTypeLabels = computed<Record<ActiveFilter['type'], string>>(() => ({
  workflow: t('workflow'),
  group: t('group'),
  name: t('name'),
  status: t('status'),
  period: t('executions.period'),
}));

const filterChips = computed<ListFilterChip<ActiveFilter['type']>[]>(() =>
  activeFilters.value.map((f) => ({
    ...f,
    typeLabel: filterTypeLabels.value[f.type],
  })),
);

const hasFilters = computed(() => activeFilters.value.length > 0);
const filterLabel = computed(() =>
  activeFilters.value.map((f) => f.label).join(' · '),
);

// Sync breadcrumb title with active filters (replace last segment on list page)
watch(
  [hasFilters, filterLabel],
  () => {
    const base = t('navigation.executions');
    breadcrumbsStore.setCurrentTitle(
      hasFilters.value ? `${base} — ${filterLabel.value}` : base,
      true,
    );
  },
  { immediate: true },
);

// ─── Data Mapping ──────────────────────────────────────────────────
const { executionErrors } = useExecutionErrors();
const mapToListData = (list: ExecutionLog[]): EntityList[] => {
  return list.map((e) => {
    const groupName = e.group ?? '';

    return {
      id: e.id,
      workflowName: e.workflowName || t('workflows.unknown'),
      workflowId: e.workflowId,
      group: groupName,
      groupSlug: groupName
        ? groupName.toLowerCase().replace(/\s+/g, '-')
        : null,
      status: e.status?.toLowerCase() ?? 'unknown',
      startTime: formatTimestamp(e.startTime),
      startTimeIso: e.startTime ?? null,
      endTime: formatTimestamp(e.endTime ?? undefined),
      durationFormatted: formatDuration(e.durationMs ?? undefined),
      durationMs: e.durationMs ?? 0,
      errorCount: e.errorCount ?? 0,
      error: executionErrors(e)[0]?.message ?? '',
      nodeCount: e.nodeExecutions?.length ?? 0,
      isTestRun: e.isTestRun ?? false,
    };
  });
};

// ─── Live ticking clock for running executions ────────────────────
const hasRunning = computed(() =>
  allData.value.some((item) => item.status === 'running'),
);
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
  } else if (nameFilter.value) {
    list = list.filter((item) => item.workflowName === nameFilter.value);
  }
  if (statusFilter.value.length) {
    list = list.filter((item) =>
      matchesExecutionStatus(item.status, statusFilter.value),
    );
  }
  return list.map(applyLiveDuration);
});

const clearFilter = () => {
  navigateTo(entityListUrl(entityKey));
};

const FILTER_QUERY_KEY: Record<ActiveFilter['type'], string> = {
  workflow: 'id',
  group: 'group',
  name: 'name',
  status: EXECUTION_LIST_QUERY_KEYS.status,
  period: EXECUTION_LIST_QUERY_KEYS.period,
};

const removeFilter = (type: ActiveFilter['type']) => {
  const { [FILTER_QUERY_KEY[type]]: _, ...rest } = route.query;
  navigateTo({ path: entityListUrl(entityKey), query: rest });
};

// ─── Live polling: new executions + running-status refresh ─────────
const POLL_INTERVAL_MS = 15_000;
const lastPollAt = ref<string>(new Date().toISOString());

const pollExecutions = async () => {
  const since = lastPollAt.value;
  lastPollAt.value = new Date().toISOString();

  // Rows shown as "running" must be re-fetched too, or they stay running
  // forever after the execution finishes. Widen the fetch window back to
  // the oldest running row so its status transition is picked up.
  const runningStarts = allData.value
    .filter((item) => item.status === 'running' && item.startTimeIso)
    .map((item) => new Date(item.startTimeIso as string).getTime())
    .filter((ts) => !Number.isNaN(ts));
  const oldestRunning = runningStarts.length
    ? Math.min(...runningStarts)
    : null;

  // With a period filter the list is a fixed historical window — only
  // refresh running rows, never inject new ones.
  if (periodFilter.value && oldestRunning === null) return;

  const startedAfter =
    oldestRunning === null
      ? since
      : new Date(
          Math.min(oldestRunning - 1000, new Date(since).getTime()),
        ).toISOString();

  const fresh = await orchestratorApi.execution.list({
    startedAfter,
    ...(workflowIdFilter.value ? { workflowId: workflowIdFilter.value } : {}),
  });
  if (!Array.isArray(fresh) || fresh.length === 0) return;

  const mapped = mapToListData(fresh);
  const byId = new Map(mapped.map((row) => [row.id, row]));
  const existingIds = new Set(allData.value.map((item) => item.id));

  const updated = allData.value.map((item) => byId.get(item.id) ?? item);
  const newRows = periodFilter.value
    ? []
    : mapped.filter((row) => !existingIds.has(row.id));
  allData.value = newRows.length ? [...newRows, ...updated] : updated;
};

usePollWhile(() => !loading.value, pollExecutions, POLL_INTERVAL_MS);

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
        entityKey: entityKey,
        idField: 'id',
        maxTextLength: 24,
      },
      workflowName: {
        entityKey: 'workflow',
        idField: 'workflowId',
      },
    },
    iconColumns: {
      status: {
        resolveIcon: resolveStatusIcon,
        entityKey: entityKey,
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
      error: t('executions.error'),
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
const hiddenColumns: StringKeyOf<EntityList>[] = [
  'groupSlug',
  'workflowId',
  'isTestRun',
  'endTime',
  'startTimeIso',
];
visibilityState.value = getVisibilityState(hiddenColumns);

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = [
  'workflowName',
  'group',
  'status',
  'error',
];
</script>

<template>
  <ContentHeader
    :title="
      hasFilters
        ? `${$t('navigation.executions')} — ${filterLabel}`
        : $t('navigation.executions')
    "
    :description="$t('executions.description')"
  />

  <ListFilterChips
    :filters="filterChips"
    @remove="removeFilter"
    @clear="clearFilter"
  />

  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-key="entityKey"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :searchable-fields="searchableFields"
      :filtered="hasFilters"
      :error="fetchError"
      :on-retry="refresh"
      @clear-filters="clearFilter"
    />
  </NuxtErrorBoundary>
</template>
