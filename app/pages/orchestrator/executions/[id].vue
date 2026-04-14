<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import type { Component } from 'vue';
import type {
  ExecutionDetailsResponse,
  ExecutionLog,
  ExecutionNodeExecution,
} from '#shared/types';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideLoader,
  LucideBan,
  LucideTimer,
  LucidePause,
  LucidePlay,
  LucideCircleAlert,
  LucideRefreshCw,
  LucideSquare,
  LucideChevronRight,
  LucideChevronDown,
  LucideTrash2,
  LucideMoreHorizontal,
} from '#components';

const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();

const executionId = computed(() => route.params.id as string);

// ─── Fetch real data ──────────────────────────────────────────────
const { data: details, pending, error, refresh } = await useAsyncData(
  () => `execution-${executionId.value}`,
  () => orchestratorApi.execution.get(executionId.value),
  { watch: [executionId] },
);

const execution = computed<ExecutionLog | null>(() => details.value?.execution ?? null);
const nodeExecutions = computed<ExecutionNodeExecution[]>(() => execution.value?.nodeExecutions ?? []);
const isRunning = computed(() => execution.value?.status?.toLowerCase() === 'running');

// Breadcrumb title
watch(execution, (exec) => {
  if (exec?.workflowName) {
    breadcrumbsStore.setCurrentTitle(exec.workflowName);
  }
}, { immediate: true });

// Live ticking clock while execution is running
const now = ref(Date.now());
let tickTimer: ReturnType<typeof setInterval> | null = null;

watch(isRunning, (running) => {
  if (running && !tickTimer) {
    now.value = Date.now();
    tickTimer = setInterval(() => { now.value = Date.now(); }, 1000);
  }
  else if (!running && tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer);
});

const liveDurationMs = computed(() => {
  if (!execution.value) return null;
  if (isRunning.value && execution.value.startTime) {
    return now.value - new Date(execution.value.startTime).getTime();
  }
  return execution.value.durationMs ?? null;
});

// ─── Formatters ────────────────────────────────────────────────────
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const shortenId = (id: string, head = 12, tail = 8): string => {
  if (!id || id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
};

const formatDuration = (ms: number | null | undefined): string => {
  if (ms == null) return '–';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
};

// ─── Status icon/color map ─────────────────────────────────────────
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

const resolveStatusIcon = (status: string) => {
  return statusIconMap[status?.toLowerCase()] ?? { icon: LucideCircleAlert, class: 'text-muted-foreground' };
};

// ─── Node timeline bars ────────────────────────────────────────────
const timelineStart = computed(() => {
  const start = execution.value?.startTime;
  return start ? new Date(start).getTime() : 0;
});
const timelineEnd = computed(() => {
  if (!execution.value) return timelineStart.value;
  if (execution.value.endTime) return new Date(execution.value.endTime).getTime();
  const last = nodeExecutions.value.reduce((acc, n) => {
    const t = n.endTime ? new Date(n.endTime).getTime() : 0;
    return t > acc ? t : acc;
  }, 0);
  return last || timelineStart.value + (execution.value.durationMs ?? 0);
});
const timelineSpan = computed(() => Math.max(1, timelineEnd.value - timelineStart.value));

const nodeBarStyle = (node: ExecutionNodeExecution) => {
  if (!node.startTime) return { left: '0%', width: '0%' };
  const start = new Date(node.startTime).getTime() - timelineStart.value;
  const end = (node.endTime ? new Date(node.endTime).getTime() : timelineEnd.value) - timelineStart.value;
  const left = (start / timelineSpan.value) * 100;
  const width = Math.max(0.5, ((end - start) / timelineSpan.value) * 100);
  return { left: `${left}%`, width: `${width}%` };
};

// ─── Expanded nodes (multi-select) ─────────────────────────────────
const expandedNodeIds = ref<Set<string>>(new Set());

const isNodeExpanded = (nodeId: string) => expandedNodeIds.value.has(nodeId);

const toggleNodeExpanded = (nodeId: string) => {
  const next = new Set(expandedNodeIds.value);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  expandedNodeIds.value = next;
};

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


// ─── Live console (mock streaming) ─────────────────────────────────
interface LogLine {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

const consoleLines = ref<LogLine[]>([]);
const consoleContainer = ref<HTMLElement | null>(null);
let logCounter = 0;

const seedLogs = () => {
  consoleLines.value = [];
  logCounter = 0;
  for (const node of nodeExecutions.value) {
    consoleLines.value.push({
      id: ++logCounter,
      timestamp: formatTime(node.startTime),
      level: 'info',
      source: node.nodeId,
      message: `▶ ${node.nodeName ?? node.nodeId} started${node.activityName ? ` (${node.activityName})` : ''}`,
    });
    const status = node.status?.toLowerCase();
    if (status === 'completed') {
      consoleLines.value.push({
        id: ++logCounter,
        timestamp: formatTime(node.endTime),
        level: 'info',
        source: node.nodeId,
        message: `✔ ${node.nodeName ?? node.nodeId} completed in ${formatDuration(node.durationMs)}`,
      });
    }
    else if (status === 'failed') {
      consoleLines.value.push({
        id: ++logCounter,
        timestamp: formatTime(node.endTime),
        level: 'error',
        source: node.nodeId,
        message: `✖ ${node.nodeName ?? node.nodeId} failed`,
      });
    }
  }
};

const scrollConsoleToBottom = () => {
  nextTick(() => {
    if (consoleContainer.value) {
      consoleContainer.value.scrollTop = consoleContainer.value.scrollHeight;
    }
  });
};

watch(execution, () => seedLogs(), { immediate: true });

// Mock live streaming when execution is in 'running' state
let streamTimer: ReturnType<typeof setInterval> | null = null;
const startLiveStream = () => {
  if (streamTimer) return;
  streamTimer = setInterval(() => {
    consoleLines.value.push({
      id: ++logCounter,
      timestamp: formatTime(new Date().toISOString()),
      level: 'debug',
      source: 'runtime',
      message: `tick #${logCounter} — heartbeat from orchestrator`,
    });
    scrollConsoleToBottom();
  }, 1500);
};

const stopLiveStream = () => {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
};

watch(isRunning, (running) => {
  if (running) startLiveStream();
  else stopLiveStream();
}, { immediate: true });

onBeforeUnmount(stopLiveStream);

const clearConsole = () => {
  consoleLines.value = [];
};

</script>

<template>
  <div v-if="error" class="text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
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
            <component :is="resolveStatusIcon(execution.status).icon"
              :class="['h-5 w-5', resolveStatusIcon(execution.status).class]" />
            <span v-if="execution.isTestRun"
              class="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
              Test run
            </span>
          </div>
          <div class="text-muted-foreground font-mono text-xs" :title="execution.id">
            {{ shortenId(execution.id) }}
          </div>
          <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <NuxtLink :to="`/orchestrator/workflows/${execution.workflowId}`" class="hover:text-foreground underline">
              {{ execution.workflowName || 'Workflow' }}
            </NuxtLink>
            <span v-if="execution.group">•</span>
            <span v-if="execution.group">{{ execution.group }}</span>
            <span>•</span>
            <span>Status: <span class="text-foreground font-medium capitalize">{{ details?.orchestrationStatus ?? execution.status }}</span></span>
            <template v-if="execution.triggerType">
              <span>•</span>
              <span>Trigger: <span class="text-foreground font-medium">{{ execution.triggerType }}{{ execution.eventName ? ` (${execution.eventName})` : '' }}</span></span>
            </template>
            <template v-if="execution.startedBy">
              <span>•</span>
              <span>By: <span class="text-foreground font-medium">{{ execution.startedBy }}</span></span>
            </template>
          </div>
        </div>
      </template>
      <ContentActionBar>
        <ButtonIcon
          icon="retry"
          :disabled="!details?.canReplay || actionPending"
          @click="runAction('Replay', () => orchestratorApi.execution.replay(executionId))">
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
          {{ formatTime(execution.startTime) }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Ended
        </div>
        <div class="font-mono text-sm">
          {{ formatTime(execution.endTime) }}
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
      <!-- Node executions timeline -->
      <div class="flex flex-col rounded-lg border lg:col-span-1">
        <div class="flex items-center justify-between border-b px-4 py-2">
          <h2 class="text-sm font-medium">
            Node Executions
          </h2>
          <span class="text-muted-foreground text-xs">
            {{ nodeExecutions.length }} nodes
          </span>
        </div>
        <div v-if="nodeExecutions.length === 0" class="text-muted-foreground p-4 text-center text-sm">
          No node executions
        </div>
        <div v-else>
          <div v-for="node in nodeExecutions" :key="node.nodeId"
            class="hover:bg-muted/50 border-b px-4 py-3 transition-colors">
            <button class="w-full cursor-pointer text-left focus:outline-none focus-visible:outline-none"
              @click="toggleNodeExpanded(node.nodeId)">
              <div class="flex items-center gap-3">
                <component :is="isNodeExpanded(node.nodeId) ? LucideChevronDown : LucideChevronRight"
                  class="text-muted-foreground h-4 w-4 shrink-0" />
                <component :is="resolveStatusIcon(node.status).icon"
                  :class="['h-4 w-4 shrink-0', resolveStatusIcon(node.status).class]" />
                <span class="text-muted-foreground font-mono text-xs tabular-nums">
                  #{{ node.executionOrder }}
                </span>
                <span class="flex-1 truncate text-sm font-medium">{{ node.nodeName }}</span>
                <span class="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs">
                  {{ node.nodeType }}
                </span>
                <span class="text-muted-foreground w-16 text-right font-mono text-xs">
                  {{ formatDuration(node.durationMs) }}
                </span>
              </div>

              <!-- Timeline bar -->
              <div class="bg-muted relative mt-2 ml-7 h-1.5 overflow-hidden rounded">
                <div class="absolute top-0 h-full rounded" :style="nodeBarStyle(node)" :class="{
                  'bg-green-500': node.status === 'completed',
                  'bg-destructive': node.status === 'failed',
                  'bg-blue-500': node.status === 'running',
                  'bg-muted-foreground': node.status === 'canceled' || node.status === 'cancelled',
                }" />
              </div>
            </button>

            <!-- Expanded details -->
            <div v-if="isNodeExpanded(node.nodeId)" class="mt-3 ml-7 space-y-3 text-xs">
              <dl class="space-y-1.5">
                <div>
                  <dt class="text-muted-foreground">
                    Node ID
                  </dt>
                  <dd class="font-mono select-all">
                    {{ node.nodeId }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Activity
                  </dt>
                  <dd class="font-mono select-all">
                    {{ node.activityName ?? '–' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Status
                  </dt>
                  <dd class="font-mono select-all capitalize">
                    {{ node.status }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Retries
                  </dt>
                  <dd class="font-mono select-all">
                    {{ node.retryCount ?? 0 }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Started
                  </dt>
                  <dd class="font-mono select-all">
                    {{ formatTime(node.startTime) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Ended
                  </dt>
                  <dd class="font-mono select-all">
                    {{ formatTime(node.endTime) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    Duration
                  </dt>
                  <dd class="font-mono select-all">
                    {{ formatDuration(node.durationMs) }}
                  </dd>
                </div>
              </dl>
              <div v-if="node.input">
                <div class="text-muted-foreground mb-1">
                  Input
                </div>
                <pre class="bg-muted max-h-40 overflow-auto rounded p-2 font-mono text-xs">{{ JSON.stringify(node.input,
                  null, 2) }}</pre>
              </div>
              <div v-if="node.output">
                <div class="text-muted-foreground mb-1">
                  Output
                </div>
                <pre class="bg-muted max-h-40 overflow-auto rounded p-2 font-mono text-xs">{{ JSON.stringify(node.output,
                  null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live console -->
      <div
        class="sticky top-4 flex h-[70vh] flex-col overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 lg:col-span-2">
        <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full" :class="isRunning ? 'animate-pulse bg-green-400' : 'bg-zinc-600'" />
            <h2 class="text-sm font-medium text-zinc-200">
              {{ isRunning ? 'Live console' : 'Console log' }}
            </h2>
            <span class="text-xs text-zinc-500">
              {{ consoleLines.length }} lines
            </span>
          </div>
          <button class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Clear console"
            @click="clearConsole">
            <LucideTrash2 class="h-3.5 w-3.5" />
          </button>
        </div>
        <div ref="consoleContainer" class="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
          <div v-if="consoleLines.length === 0" class="text-zinc-600">
            No output
          </div>
          <div v-for="line in consoleLines" :key="line.id" class="flex gap-2">
            <span class="shrink-0 text-zinc-600">{{ line.timestamp }}</span>
            <span class="w-10 shrink-0 uppercase" :class="{
              'text-zinc-500': line.level === 'debug',
              'text-blue-400': line.level === 'info',
              'text-yellow-400': line.level === 'warn',
              'text-red-400': line.level === 'error',
            }">
              {{ line.level }}
            </span>
            <span class="w-32 shrink-0 truncate text-zinc-500">{{ line.source }}</span>
            <span class="flex-1 break-all text-zinc-200">{{ line.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
