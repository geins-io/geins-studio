<script setup lang="ts">
import type {
  WorkflowMetrics,
  AggregateMetrics,
  HealthStatus,
} from '#shared/types';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';


// ─── Types ─────────────────────────────────────────────────────────
interface WorkflowGroupCard {
  id: string;
  name: string;
  description: string;
  avatar: string;
  workflowCount: number;
  enabledCount: number;
  health: HealthStatus | 'Idle';
  lastSync: string;
  executions24h: number;
  executions7d: number;
  executionsTotal: number;
  successRate: number;
  workflowIds: string[];
  allEnabled: boolean;
  isStandalone: boolean;
}

const _i18n = useI18n();

definePageMeta({
  pageType: 'default',
});

// ─── Global Setup ──────────────────────────────────────────────────
const { orchestratorApi } = useGeinsRepository();
const loading = ref(true);
const fetchError = ref(false);
const groups = ref<WorkflowGroupCard[]>([]);

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: metrics, error: metricsError, refresh } = await useAsyncData<WorkflowMetrics[]>(
  'overview-workflows-metrics',
  () => orchestratorApi.metrics.list(),
);

const { data: aggregate } = await useAsyncData<AggregateMetrics>(
  'overview-workflows-aggregate',
  () => orchestratorApi.metrics.getAggregate(),
);

// ─── Helpers ───────────────────────────────────────────────────────
const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  if (trimmed.length === 1) return trimmed.toUpperCase();
  return (trimmed.charAt(0) + trimmed.charAt(trimmed.length - 1)).toUpperCase();
};

/** API returns lowercase health values; normalize to HealthStatus (PascalCase). */
const normalizeHealth = (raw: string | undefined): HealthStatus =>
  raw ? (raw.charAt(0).toUpperCase() + raw.slice(1)) as HealthStatus : 'Unknown';

const deriveGroupHealth = (
  workflowHealths: HealthStatus[],
  allEnabled: boolean,
): HealthStatus | 'Idle' => {
  if (!allEnabled && workflowHealths.every(h => h === 'Disabled' || h === 'Unknown')) return 'Idle';
  if (workflowHealths.some(h => h === 'Unhealthy')) return 'Unhealthy';
  if (workflowHealths.some(h => h === 'Degraded')) return 'Degraded';
  if (workflowHealths.every(h => h === 'Healthy')) return 'Healthy';
  return 'Unknown';
};

const formatRelativeTime = (isoDate: string): string => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const formatThroughput = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

const mapToGroups = (metricsList: WorkflowMetrics[]): WorkflowGroupCard[] => {
  type GroupBucket = { metrics: WorkflowMetrics[] };
  const groupMap = new Map<string, GroupBucket>();
  const ungrouped: WorkflowMetrics[] = [];

  for (const m of metricsList) {
    const groupName = m.group ?? '';
    if (!groupName) {
      ungrouped.push(m);
      continue;
    }
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, { metrics: [] });
    }
    groupMap.get(groupName)!.metrics.push(m);
  }

  const buildCard = (
    name: string,
    description: string,
    items: WorkflowMetrics[],
    standalone = false,
  ): WorkflowGroupCard => {
    const totalExecutions24h = items.reduce((sum, m) => sum + (m.metrics24h?.totalExecutions ?? 0), 0);
    const totalExecutions7d = items.reduce((sum, m) => sum + (m.metrics7d?.totalExecutions ?? 0), 0);
    const totalExecutions = items.reduce((sum, m) => sum + (m.metricsAllTime?.totalExecutions ?? 0), 0);
    const totalSuccess = items.reduce((sum, m) => sum + (m.metrics24h?.successfulExecutions ?? 0), 0);
    const totalExec = items.reduce((sum, m) => sum + (m.metrics24h?.totalExecutions ?? 0), 0);
    const successRate = totalExec > 0 ? Math.round((totalSuccess / totalExec) * 100) : 100;
    const healths: HealthStatus[] = items.map(m => normalizeHealth(m.status?.health));
    const enabledItems = items.filter(m => m.enabled);
    const allEnabled = enabledItems.length === items.length;
    const lastUpdated = items.reduce((latest, m) => {
      const d = m.updatedAt || m.createdAt || m.lastMetricsUpdate || '';
      return d > latest ? d : latest;
    }, '');
    const workflowIds = items.map(m => m.id);
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    return {
      id: slug,
      name,
      description,
      avatar: getInitials(name),
      workflowCount: items.length,
      enabledCount: enabledItems.length,
      health: deriveGroupHealth(healths, allEnabled),
      lastSync: lastUpdated ? formatRelativeTime(lastUpdated) : 'Never',
      executions24h: totalExecutions24h,
      executions7d: totalExecutions7d,
      executionsTotal: totalExecutions,
      successRate,
      workflowIds,
      allEnabled,
      isStandalone: standalone,
    };
  };

  const groupCards = Array.from(groupMap.entries()).map(([groupName, bucket]) =>
    buildCard(
      groupName,
      `${bucket.metrics.length} workflow${bucket.metrics.length !== 1 ? 's' : ''} in this group`,
      bucket.metrics,
    ),
  );

  const standaloneCards = ungrouped.map(m =>
    buildCard(m.name || 'Unnamed Workflow', m.description || '', [m], true),
  );

  return [...groupCards, ...standaloneCards];
};

// ─── KPI Stats ─────────────────────────────────────────────────────
const stats = computed(() => {
  const agg = aggregate.value;
  return {
    total: agg?.workflowCount ?? 0,
    healthy: agg?.healthSummary?.healthy ?? 0,
    executions24h: agg?.totalExecutions24h ?? 0,
    failures24h: agg?.totalFailures24h ?? 0,
    successRate24h: agg?.overallSuccessRate24h ?? 100,
    groups: groups.value.length,
  };
});

// ─── Bulk Actions ──────────────────────────────────────────────────
const togglingGroup = ref<string | null>(null);

const toggleGroup = async (group: WorkflowGroupCard, enable: boolean) => {
  togglingGroup.value = group.id;
  try {
    for (const wfId of group.workflowIds) {
      const wf = await orchestratorApi.workflow.get(wfId);
      await orchestratorApi.workflow.update(wfId, {
        ...wf,
        enabled: enable,
      });
    }
    await refresh();
  }
  catch {
    // TODO: toast error
  }
  finally {
    togglingGroup.value = null;
  }
};

// ─── Populate Groups ───────────────────────────────────────────────
watchEffect(() => {
  if (metricsError.value) {
    fetchError.value = true;
    groups.value = [];
    loading.value = false;
    return;
  }
  fetchError.value = false;
  const safeMetrics = Array.isArray(metrics.value) ? metrics.value : [];
  groups.value = mapToGroups(safeMetrics);
  loading.value = false;
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
            <p class="text-muted-foreground text-sm">{{ $t('workflows.healthy_workflows') }}</p>
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
            <p class="text-muted-foreground text-sm">Success Rate</p>
            <p class="text-2xl font-bold" :class="stats.successRate24h < 95 ? 'text-yellow-500' : 'text-green-500'">
              {{ stats.successRate24h }}%
            </p>
          </div>
          <LucideTarget class="h-8 w-8" :class="stats.successRate24h < 95 ? 'text-yellow-500' : 'text-green-500'" />
        </div>
      </CardContent>
    </Card>
  </div>

  <NuxtErrorBoundary>
    <!-- Loading -->
    <div v-if="loading" class="grid gap-5 md:grid-cols-2">
      <Card v-for="i in 2" :key="i" class="animate-pulse">
        <CardContent class="pt-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-muted h-10 w-10 rounded-full" />
            <div class="space-y-2">
              <div class="bg-muted h-4 w-32 rounded" />
              <div class="bg-muted h-3 w-48 rounded" />
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div class="bg-muted h-12 rounded" />
            <div class="bg-muted h-12 rounded" />
            <div class="bg-muted h-12 rounded" />
            <div class="bg-muted h-12 rounded" />
          </div>
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
    <Card v-else-if="groups.length === 0">
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

    <!-- Workflow Group Cards -->
    <div v-else class="grid gap-5 md:grid-cols-2">
      <Card
v-for="group in groups" :key="group.id"
        class="hover:border-primary/30 group relative flex flex-col transition-all duration-200 hover:shadow-md">
        <CardHeader class="pt-5 pb-4">
          <!-- Header: Avatar + Name + Health Badge -->
          <div class="flex items-start justify-between">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <Avatar class="mr-1 size-10 rounded-lg">
                <AvatarFallback class="rounded-lg text-sm">
                  {{ group.avatar }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <CardTitle class="text-base leading-tight">
                  {{ group.name }}
                </CardTitle>
                <CardDescription class="mt-0.5 line-clamp-1 text-xs">
                  {{ group.description }}
                </CardDescription>
              </div>
            </div>
            <StatusBadge :status="group.health.toLowerCase()" class="mt-0.5 ml-2 shrink-0" />
          </div>
        </CardHeader>

        <CardContent class="flex flex-1 flex-col pt-0">
          <!-- Metrics Grid -->
          <div class="bg-muted/30 mt-1 grid grid-cols-3 gap-px overflow-hidden rounded-lg border">
            <!-- ACTIVE WORKFLOWS -->
            <div class="bg-background flex flex-col gap-0.5 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Active
                Workflows</span>
              <span class="text-sm font-semibold">
                {{ group.enabledCount }}/{{ group.workflowCount }}
              </span>
            </div>
            <!-- LAST SYNC -->
            <div class="bg-background flex flex-col gap-0.5 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Last Sync</span>
              <span class="text-sm font-semibold">{{ group.lastSync }}</span>
            </div>
            <!-- SUCCESS RATE -->
            <div class="bg-background flex flex-col gap-0.5 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Success Rate</span>
              <span
class="text-sm font-semibold"
                :class="group.successRate < 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'">
                {{ group.successRate }}%
              </span>
            </div>
            <!-- EXECUTIONS -->
            <div class="bg-background col-span-3 flex flex-col gap-1 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Executions</span>
              <div class="flex items-center gap-3">
                <span class="text-sm font-semibold">
                  {{ formatThroughput(group.executions24h) }}
                  <span class="text-muted-foreground text-[10px] font-normal">24h</span>
                </span>
                <span class="text-muted-foreground text-xs">·</span>
                <span class="text-sm font-semibold">
                  {{ formatThroughput(group.executions7d) }}
                  <span class="text-muted-foreground text-[10px] font-normal">7d</span>
                </span>
                <span class="text-muted-foreground text-xs">·</span>
                <span class="text-sm font-semibold">
                  {{ formatThroughput(group.executionsTotal) }}
                  <span class="text-muted-foreground text-[10px] font-normal">total</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-1">
              <NuxtLink
                :to="{ path: '/orchestrator/workflows', query: group.isStandalone ? { name: group.name } : { group: group.id } }">
                <Button variant="outline" size="icon" class="h-7 w-7" title="Workflows">
                  <LucideWorkflow class="h-3.5 w-3.5" />
                </Button>
              </NuxtLink>
              <NuxtLink
                :to="{ path: '/orchestrator/executions', query: group.isStandalone ? { name: group.name } : { group: group.id } }">
                <Button variant="outline" size="icon" class="h-7 w-7" title="Executions">
                  <LucideHistory class="h-3.5 w-3.5" />
                </Button>
              </NuxtLink>
              <NuxtLink v-if="group.workflowCount === 1" :to="`/orchestrator/workflows/${group.workflowIds[0]}`">
                <Button variant="outline" size="icon" class="h-7 w-7" title="Edit workflow">
                  <LucidePencil class="h-3.5 w-3.5" />
                </Button>
              </NuxtLink>
            </div>
            <div class="flex items-center gap-1.5">
              <Button
v-if="group.allEnabled" variant="outline" size="sm" class="h-7 text-xs"
                :disabled="togglingGroup === group.id" @click="toggleGroup(group, false)">
                <LucidePause class="mr-1 h-3 w-3" />
                {{ $t('workflows.pause') }}
              </Button>
              <Button
v-else variant="default" size="sm" class="h-7 text-xs" :disabled="togglingGroup === group.id"
                @click="toggleGroup(group, true)">
                <LucidePlay class="mr-1 h-3 w-3" />
                {{ $t('workflows.enable') }}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </NuxtErrorBoundary>
</template>
