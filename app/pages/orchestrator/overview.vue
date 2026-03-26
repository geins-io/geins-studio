<script setup lang="ts">
import type {
  WorkflowSummary,
  WorkflowMetrics,
  AggregateMetrics,
} from '#shared/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';

interface WorkflowCard {
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

const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const { orchestratorApi } = useGeinsRepository();
const loading = ref(true);
const fetchError = ref(false);
const dataList = ref<WorkflowCard[]>([]);

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: workflows, error: workflowError, refresh } = await useAsyncData<Entity[]>(
  'overview-workflows-list',
  () => orchestratorApi.workflow.list(),
);

const { data: rawMetrics } = await useAsyncData(
  'overview-workflows-metrics',
  () => orchestratorApi.metrics.list(),
);

const metrics = computed<WorkflowMetrics[]>(() => {
  const raw = rawMetrics.value;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'workflows' in (raw as Record<string, unknown>)) {
    return (raw as unknown as { workflows: WorkflowMetrics[] }).workflows;
  }
  return [];
});

const { data: aggregate } = await useAsyncData<AggregateMetrics>(
  'overview-workflows-aggregate',
  () => orchestratorApi.metrics.getAggregate(),
);

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

const mapToCards = (
  list: Record<string, unknown>[],
  metricsList: Record<string, unknown>[],
): WorkflowCard[] => {
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

// ─── KPI Stats ─────────────────────────────────────────────────────
const stats = computed(() => {
  const agg = aggregate.value as unknown as Record<string, unknown> | null;
  const healthSum = agg?.healthSummary as Record<string, unknown> | undefined;
  const healthBreakdown = agg?.healthBreakdown as Record<string, unknown> | undefined;

  const executions24h = Number(agg?.totalExecutions24h ?? agg?.executions24h ?? 0);
  const successRate24h = Number(agg?.overallSuccessRate24h ?? agg?.successRate24h ?? 100);

  const failures24h = agg?.totalFailures24h !== undefined
    ? Number(agg.totalFailures24h)
    : Math.round(executions24h * ((100 - successRate24h) / 100));

  return {
    total: Number(agg?.workflowCount ?? agg?.totalWorkflows ?? 0),
    healthy: Number(healthSum?.healthy ?? healthBreakdown?.Healthy ?? 0),
    executions24h,
    failures24h,
  };
});

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

// ─── Populate Cards ────────────────────────────────────────────────
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
      dataList.value = mapToCards(
        safeData as Record<string, unknown>[],
        (newMetrics || []) as unknown as Record<string, unknown>[],
      );
      loading.value = false;
    },
    { immediate: true },
  );
});
</script>

<template>
  <ContentHeader :title="$t('navigation.orchestrator')" :description="$t('orchestrator.description')" />
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
            <p class="text-2xl font-bold" :class="stats.failures24h > 0 ? 'text-red-500' : ''">
              {{ stats.failures24h }}
            </p>
          </div>
          <LucideXCircle class="h-8 w-8" :class="stats.failures24h > 0 ? 'text-red-500' : 'text-muted-foreground'" />
        </div>
      </CardContent>
    </Card>
  </div>

  <NuxtErrorBoundary>
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
          <NuxtLink to="/orchestrator/workflows/new">
            <Button>
              {{ $t('new_entity', { entityName: 'workflow' }) }}
            </Button>
          </NuxtLink>
        </div>
      </CardContent>
    </Card>

    <!-- Workflow Cards Grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="workflow in dataList" :key="workflow.id"
        class="hover:border-primary/50 flex flex-col pt-5 transition-colors">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1 space-y-1">
              <CardTitle class="text-base">
                <NuxtLink :to="`/orchestrator/workflows/${workflow.id}`" class="hover:underline">
                  {{ workflow.name }}
                </NuxtLink>
              </CardTitle>
              <CardDescription class="line-clamp-2">
                {{ workflow.description }}
              </CardDescription>
            </div>
            <div class="ml-2 flex shrink-0 items-center gap-1.5">
              <span :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                healthColors[workflow.health] || healthColors.unknown,
              ]">
                {{ workflow.health }}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex flex-1 flex-col pt-0">
          <div class="text-muted-foreground mt-auto mb-4 flex items-center gap-4 text-sm">
            <span :class="[
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              typeColors[workflow.type] || typeColors.OnDemand,
            ]">
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
            <NuxtLink :to="`/orchestrator/workflows/${workflow.id}`">
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
  </NuxtErrorBoundary>

</template>
