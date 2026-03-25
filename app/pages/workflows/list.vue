<script setup lang="ts">
import type {
  Workflow,
  WorkflowMetrics,
  WorkflowAggregateMetrics,
  WorkflowListItem,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';

type Entity = Workflow;
type EntityList = WorkflowListItem;

const scope = 'pages/workflows/list.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── View Mode ─────────────────────────────────────────────────────
const VIEW_MODE_KEY = 'workflows-view-mode';
const viewMode = ref<'table' | 'cards'>(
  (typeof localStorage !== 'undefined'
    ? (localStorage.getItem(VIEW_MODE_KEY) as 'table' | 'cards')
    : null) || 'table',
);
watch(viewMode, (v) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(VIEW_MODE_KEY, v);
});

// ─── Global Setup ──────────────────────────────────────────────────
const { workflowApi } = useGeinsRepository();
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
  () => workflowApi.workflow.list(),
);

const { data: rawMetrics } = await useAsyncData(
  'workflows-metrics',
  () => workflowApi.metrics.listAll(),
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

const { data: aggregate } = await useAsyncData<WorkflowAggregateMetrics>(
  'workflows-aggregate',
  () => workflowApi.metrics.getAggregate(),
);

// ─── Data Mapping ──────────────────────────────────────────────────
const deriveTriggerSummary = (
  wf: Entity,
  wfMetrics?: WorkflowMetrics,
): string => {
  if (wfMetrics?.cronExpression) return wfMetrics.cronExpression;
  if (wfMetrics?.eventName) return wfMetrics.eventName;
  if (wf.trigger?.type) return wf.trigger.type;
  return t('workflows.trigger_manual');
};

const mapToListData = (
  list: Entity[],
  metricsList: WorkflowMetrics[],
): EntityList[] => {
  const metricsMap = new Map(metricsList.map((m) => [m.workflowId, m]));

  return list.map((wf) => {
    // API returns 'id' but EntityBase types it as '_id'
    const workflowId = wf._id || (wf as unknown as { id: string }).id || '';
    const wfMetrics = metricsMap.get(workflowId);
    return {
      id: workflowId,
      name: wf.name,
      description: wf.description || '',
      type: wf.trigger?.type || 'OnDemand',
      triggerSummary: deriveTriggerSummary(wf, wfMetrics),
      nodeCount: wf.steps?.length || 0,
      health: wfMetrics?.status?.health || 'unknown',
      enabled: wfMetrics?.enabled ?? wf.enabled ?? false,
    };
  });
};

// ─── KPI Stats ─────────────────────────────────────────────────────
const stats = computed(() => {
  const agg = aggregate.value;
  return {
    total: agg?.workflowCount ?? 0,
    healthy: agg?.healthSummary?.healthy ?? 0,
    executions24h: agg?.totalExecutions24h ?? 0,
    failures24h: agg?.totalFailures24h ?? 0,
  };
});

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
      const safeData = Array.isArray(newData) ? newData : [];
      dataList.value = mapToListData(safeData, newMetrics || []);
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
      name: { url: '/workflows/{id}', idField: 'id' },
    },
    columnTitles: {
      name: t('name'),
      description: t('workflows.table_description'),
      type: t('workflows.type'),
      triggerSummary: t('workflows.trigger'),
      nodeCount: t('workflows.node_count'),
      health: t('workflows.health'),
      enabled: t('active'),
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

// ─── Card Helpers ──────────────────────────────────────────────────
const healthColors: Record<string, string> = {
  healthy: 'bg-green-500/10 text-green-600 dark:text-green-400',
  degraded: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  unhealthy: 'bg-red-500/10 text-red-600 dark:text-red-400',
  disabled: 'bg-gray-500/10 text-gray-500',
  unknown: 'bg-gray-500/10 text-gray-400',
};

const typeColors: Record<string, string> = {
  Scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Event: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  OnDemand: 'bg-gray-500/10 text-gray-500',
};
</script>

<template>
  <ContentHeader :title="$t('navigation.workflows')">
    <ContentActionBar>
      <div class="mr-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          :class="viewMode === 'table' ? 'bg-accent' : ''"
          :aria-label="$t('workflows.view_table')"
          @click="viewMode = 'table'"
        >
          <LucideLayoutList class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="viewMode === 'cards' ? 'bg-accent' : ''"
          :aria-label="$t('workflows.view_cards')"
          @click="viewMode = 'cards'"
        >
          <LucideLayoutGrid class="h-4 w-4" />
        </Button>
      </div>
      <ButtonIcon icon="new" href="/workflows/new">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <!-- KPI Stat Cards -->
  <div class="mb-6 grid gap-4 md:grid-cols-4">
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted-foreground text-sm">{{ $t('workflows.total') }}</p>
            <p class="text-2xl font-bold">{{ stats.total }}</p>
          </div>
          <LucideWorkflow class="text-muted-foreground h-8 w-8" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted-foreground text-sm">{{ $t('workflows.healthy') }}</p>
            <p class="text-2xl font-bold text-green-500">{{ stats.healthy }}</p>
          </div>
          <LucideCheckCircle2 class="h-8 w-8 text-green-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted-foreground text-sm">{{ $t('workflows.executions_24h') }}</p>
            <p class="text-2xl font-bold">{{ stats.executions24h.toLocaleString() }}</p>
          </div>
          <LucideClock class="text-muted-foreground h-8 w-8" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted-foreground text-sm">{{ $t('workflows.failures_24h') }}</p>
            <p
              class="text-2xl font-bold"
              :class="stats.failures24h > 0 ? 'text-red-500' : ''"
            >
              {{ stats.failures24h }}
            </p>
          </div>
          <LucideXCircle
            class="h-8 w-8"
            :class="stats.failures24h > 0 ? 'text-red-500' : 'text-muted-foreground'"
          />
        </div>
      </CardContent>
    </Card>
  </div>

  <NuxtErrorBoundary>
    <!-- Table View -->
    <TableView
      v-if="viewMode === 'table'"
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :error="fetchError"
      :on-retry="refresh"
    >
      <template #empty-actions>
        <ButtonIcon
          icon="new"
          variant="secondary"
          @click="navigateTo('/workflows/new')"
        >
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>

    <!-- Card View -->
    <div v-else>
      <!-- Loading -->
      <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="i in 6" :key="i" class="animate-pulse">
          <CardContent class="pt-6">
            <div class="bg-muted mb-3 h-4 w-3/4 rounded" />
            <div class="bg-muted mb-2 h-3 w-full rounded" />
            <div class="bg-muted h-3 w-1/2 rounded" />
          </CardContent>
        </Card>
      </div>

      <!-- Error -->
      <Card v-else-if="fetchError">
        <CardContent class="py-12">
          <div class="flex flex-col items-center justify-center text-center">
            <LucideXCircle class="text-destructive mb-4 h-12 w-12" />
            <h3 class="mb-2 text-lg font-medium">{{ $t('feedback_error') }}</h3>
            <p class="text-muted-foreground mb-4">{{ $t('error_empty_description') }}</p>
            <Button @click="refresh()">
              {{ $t('retry') }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Empty -->
      <Card v-else-if="dataList.length === 0" class="md:col-span-2 lg:col-span-3">
        <CardContent class="py-12">
          <div class="flex flex-col items-center justify-center text-center">
            <LucideWorkflow class="text-muted-foreground mb-4 h-12 w-12" />
            <h3 class="mb-2 text-lg font-medium">{{ $t('workflows.no_workflows') }}</h3>
            <p class="text-muted-foreground mb-4">{{ $t('workflows.create_first') }}</p>
            <NuxtLink to="/workflows/new">
              <Button>
                {{ $t('new_entity', { entityName }) }}
              </Button>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <!-- Workflow Cards Grid -->
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="workflow in dataList"
          :key="workflow.id"
          class="hover:border-primary/50 flex flex-col pt-5 transition-colors"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1 space-y-1">
                <CardTitle class="text-base">
                  <NuxtLink
                    :to="`/workflows/${workflow.id}`"
                    class="hover:underline"
                  >
                    {{ workflow.name }}
                  </NuxtLink>
                </CardTitle>
                <CardDescription class="line-clamp-2">
                  {{ workflow.description }}
                </CardDescription>
              </div>
              <div class="ml-2 flex shrink-0 items-center gap-1.5">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    healthColors[workflow.health] || healthColors.unknown,
                  ]"
                >
                  {{ workflow.health }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col pt-0">
            <div class="text-muted-foreground mt-auto mb-4 flex items-center gap-4 text-sm">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  typeColors[workflow.type] || typeColors.OnDemand,
                ]"
              >
                {{ workflow.type }}
              </span>
              <div class="flex items-center gap-1">
                <LucideWorkflow class="h-3.5 w-3.5" />
                <span>{{ $t('workflows.nodes', { count: workflow.nodeCount }) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <LucideZap class="h-3.5 w-3.5" />
                <span>{{ workflow.triggerSummary }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Button disabled variant="outline" size="sm">
                <LucidePlay class="mr-1 h-3.5 w-3.5" />
                Activate
              </Button>
              <NuxtLink :to="`/workflows/${workflow.id}`">
                <Button variant="outline" size="sm">
                  <LucidePencil class="mr-1 h-3.5 w-3.5" />
                  {{ $t('edit') }}
                </Button>
              </NuxtLink>
              <Button disabled variant="ghost" size="sm">
                <LucideCopy class="h-3.5 w-3.5" />
              </Button>
              <Button disabled variant="ghost" size="sm">
                <LucideTrash2 class="text-destructive h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </NuxtErrorBoundary>
</template>
