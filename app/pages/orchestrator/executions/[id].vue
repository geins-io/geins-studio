<script setup lang="ts">
import type {
  ExecutionDetailsResponse,
  ExecutionLog,
  ExecutionNodeExecution,
  LiveConsoleLine,
} from '#shared/types';
import { formatDuration, formatTimestamp } from '#shared/utils/time';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  LucidePause,
  LucideRefreshCw,
  LucideSquare,
  LucideMoreHorizontal,
  LucideCirclePlay,
  LucideCopy,
  LucideCheck,
} from '#components';

const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();

const executionId = computed(() => route.params.id as string);

// ─── Fetch real data ──────────────────────────────────────────────
// Cache completed/terminal executions (they don't change), but always refetch
// running/pending/queued ones so the user sees live progress.
const VOLATILE_STATUSES = new Set(['running', 'pending', 'queued', 'suspended', 'paused']);

const { data: details, pending, error, refresh } = await useAsyncData(
  () => `execution-${executionId.value}`,
  () => orchestratorApi.execution.get(executionId.value),
  {
    watch: [executionId],
    getCachedData: (key, nuxtApp) => {
      const cached = nuxtApp.payload.data[key] as ExecutionDetailsResponse | undefined;
      if (!cached?.execution) return undefined;
      const status = cached.execution.status?.toLowerCase() ?? '';
      return VOLATILE_STATUSES.has(status) ? undefined : cached;
    },
  },
);

const execution = computed<ExecutionLog | null>(() => details.value?.execution ?? null);
const nodeExecutions = computed<ExecutionNodeExecution[]>(() => execution.value?.nodeExecutions ?? []);
const isRunning = computed(() => execution.value?.status?.toLowerCase() === 'running');

// Fallback: derive canResume from status when API doesn't return it
const canResume = computed(() => {
  if (details.value?.canResume != null) return details.value.canResume;
  const s = execution.value?.status?.toLowerCase();
  return s === 'suspended' || s === 'paused';
});

// Breadcrumb title
watch(execution, (exec) => {
  if (exec?.workflowName) {
    breadcrumbsStore.setCurrentTitle(exec.workflowName);
  }
}, { immediate: true });

// Live ticking clock + polling while execution is running
const { now } = useLiveClock(isRunning);
usePollWhile(isRunning, () => refresh(), 3000);

const liveDurationMs = computed(() => {
  if (!execution.value) return null;
  if (isRunning.value && execution.value.startTime) {
    return now.value - new Date(execution.value.startTime).getTime();
  }
  return execution.value.durationMs ?? null;
});

const { resolveStatusIcon } = useExecutionStatus();

const shortenId = (id: string, head = 12, tail = 8): string => {
  if (!id || id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
};

// ─── Node timeline range (passed to NodeExecutions) ───────────────
const timelineStart = computed(() => {
  const start = execution.value?.startTime;
  return start ? new Date(start).getTime() : null;
});
const timelineEnd = computed(() => {
  if (!execution.value) return null;
  if (execution.value.endTime) return new Date(execution.value.endTime).getTime();
  if (timelineStart.value != null && execution.value.durationMs != null) {
    return timelineStart.value + execution.value.durationMs;
  }
  return null;
});

// ─── Actions ───────────────────────────────────────────────────────
const { toast } = useToast();
const actionPending = ref(false);

const runAction = async (label: string, fn: () => Promise<unknown>) => {
  actionPending.value = true;
  try {
    await fn();
    await refresh();
    toast({ title: `${label} successful` });
  }
  catch (err) {
    toast({
      title: `${label} failed`,
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  }
  finally {
    actionPending.value = false;
  }
};

const copiedId = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const copyExecutionId = async () => {
  if (!execution.value?.id) return;
  try {
    await navigator.clipboard.writeText(execution.value.id);
    copiedId.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copiedId.value = false; }, 1500);
  }
  catch (err) {
    toast({
      title: 'Copy failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  }
};

const handleReplay = async () => {
  actionPending.value = true;
  try {
    const res = await orchestratorApi.execution.replay(executionId.value);
    const newId = res?.newExecutionId ?? res?.executionId ?? res?.instanceId;
    if (!newId) {
      throw new Error(res?.message ?? 'Replay did not return a new execution id');
    }
    toast({ title: 'Replay started', description: res?.message ?? `New execution: ${newId}` });
    await navigateTo(`/orchestrator/executions/${newId}`);
  }
  catch (err) {
    toast({
      title: 'Replay failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  }
  finally {
    actionPending.value = false;
  }
};


// ─── Live console ──────────────────────────────────────────────────
const { accessToken, accountKey } = useGeinsAuth();

const consoleStreamUrl = computed(() =>
  executionId.value
    ? `/api/orchestrator/executions/${encodeURIComponent(executionId.value)}/stream`
    : null,
);

const consoleStreamHeaders = computed<Record<string, string>>(() => ({
  ...(accessToken.value ? { 'x-access-token': accessToken.value } : {}),
  ...(accountKey.value ? { 'x-account-key': accountKey.value } : {}),
}));

const consoleSeedLines = computed<LiveConsoleLine[]>(() => {
  const lines: LiveConsoleLine[] = [];
  let id = 0;
  for (const node of nodeExecutions.value) {
    lines.push({
      id: ++id,
      timestamp: formatTimestamp(node.startTime),
      level: 'info',
      source: node.nodeId,
      message: `▶ ${node.nodeName ?? node.nodeId} started${node.activityName ? ` (${node.activityName})` : ''}`,
    });
    const status = node.status?.toLowerCase();
    if (status === 'completed') {
      lines.push({
        id: ++id,
        timestamp: formatTimestamp(node.endTime),
        level: 'info',
        source: node.nodeId,
        message: `✔ ${node.nodeName ?? node.nodeId} completed in ${formatDuration(node.durationMs)}`,
      });
    }
    else if (status === 'failed') {
      lines.push({
        id: ++id,
        timestamp: formatTimestamp(node.endTime),
        level: 'error',
        source: node.nodeId,
        message: `✖ ${node.nodeName ?? node.nodeId} failed`,
      });
    }
  }
  return lines;
});

</script>

<template>
  <div v-if="error" class="text-destructive border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
    Failed to load execution: {{ error.message ?? 'Unknown error' }}
  </div>
  <div v-else-if="!execution" class="text-muted-foreground py-12 text-center text-sm">
    Loading execution…
  </div>
  <div v-else class="flex flex-col gap-4">
    <ContentHeader :title="execution.workflowName" :description="execution.id">
      <template #title>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold">
              {{ execution.workflowName }}
            </h1>
            <component
:is="resolveStatusIcon(execution.status).icon"
              :class="['h-5 w-5', resolveStatusIcon(execution.status).class]" />
            <span
v-if="execution.isTestRun"
              class="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
              Test run
            </span>
          </div>
          <div class="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
            <span :title="execution.id">{{ shortenId(execution.id) }}</span>
            <button
class="hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
              :title="copiedId ? 'Copied!' : 'Copy execution ID'" @click="copyExecutionId">
              <component :is="copiedId ? LucideCheck : LucideCopy" class="h-3 w-3" />
            </button>
          </div>
          <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <NuxtLink :to="`/orchestrator/workflows/${execution.workflowId}`" class="hover:text-foreground underline">
              {{ execution.workflowName || 'Workflow' }}
            </NuxtLink>
            <span v-if="execution.group">•</span>
            <span v-if="execution.group">{{ execution.group }}</span>
            <span>•</span>
            <span>Status: <span class="text-foreground font-medium capitalize">{{ details?.orchestrationStatus ??
              execution.status }}</span></span>
            <template v-if="execution.triggerType">
              <span>•</span>
              <span>Trigger: <span class="text-foreground font-medium">{{ execution.triggerType }}{{ execution.eventName
                ? ` (${execution.eventName})` : '' }}</span></span>
            </template>
            <template v-if="execution.startedBy">
              <span>•</span>
              <span>By: <span class="text-foreground font-medium">{{ execution.startedBy }}</span></span>
            </template>
          </div>
        </div>
      </template>
      <ContentActionBar>
        <ButtonIcon icon="retry" :disabled="!details?.canReplay || actionPending" @click="handleReplay">
          Replay
        </ButtonIcon>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="icon" variant="secondary">
              <LucideMoreHorizontal class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
:disabled="!details?.canCancel || actionPending"
              @click="runAction('Cancel', () => orchestratorApi.execution.cancel(executionId))">
              <LucideSquare class="mr-2 size-4" />
              <span>Cancel</span>
            </DropdownMenuItem>
            <DropdownMenuItem
:disabled="!details?.canPause || actionPending"
              @click="runAction('Pause', () => orchestratorApi.execution.pause(executionId))">
              <LucidePause class="mr-2 size-4" />
              <span>Pause</span>
            </DropdownMenuItem>
            <DropdownMenuItem
:disabled="!canResume || actionPending"
              @click="runAction('Resume', () => orchestratorApi.execution.resume(executionId))">
              <LucideCirclePlay class="mr-2 size-4" />
              <span>Resume</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem :disabled="pending" @click="refresh()">
              <LucideRefreshCw class="mr-2 size-4" />
              <span>Refresh</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ContentActionBar>
    </ContentHeader>

    <!-- Meta cards -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Started
        </div>
        <div class="font-mono text-sm">
          {{ formatTimestamp(execution.startTime) }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Ended
        </div>
        <div class="font-mono text-sm">
          {{ formatTimestamp(execution.endTime) }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground flex items-center gap-1.5 text-xs">
          Duration
          <span v-if="isRunning" class="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" title="Live" />
        </div>
        <div class="font-mono text-sm tabular-nums">
          {{ formatDuration(liveDurationMs) }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Errors
        </div>
        <div class="font-mono text-sm" :class="(execution.errorCount ?? 0) > 0 ? 'text-destructive' : ''">
          {{ execution.errorCount ?? 0 }}
        </div>
      </div>
      <div v-if="execution.totalNodes != null" class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Nodes
        </div>
        <div class="font-mono text-sm">
          {{ execution.completedNodes ?? 0 }} / {{ execution.totalNodes }}
          <span v-if="execution.failedNodes" class="text-destructive">({{ execution.failedNodes }} failed)</span>
        </div>
      </div>
      <div v-if="execution.workflowVersion != null" class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Version
        </div>
        <div class="font-mono text-sm">
          v{{ execution.workflowVersion }}
        </div>
      </div>
    </div>

    <!-- Main content: nodes + console -->
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <OrchestratorNodeExecutions
        class="lg:col-span-1"
        :nodes="nodeExecutions"
        :timeline-start="timelineStart"
        :timeline-end="timelineEnd"
      />

      <!-- Live console -->
      <OrchestratorLiveConsole
        class="sticky top-4 h-[70vh] lg:col-span-2"
        :stream-url="consoleStreamUrl"
        :active="isRunning"
        :seed-lines="consoleSeedLines"
        :request-headers="consoleStreamHeaders"
      />
    </div>
  </div>
</template>
