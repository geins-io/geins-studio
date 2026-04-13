<script setup lang="ts">
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
  LucideRepeat,
  LucideChevronRight,
  LucideChevronDown,
  LucideTrash2,
} from '#components';
import type { Component } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';

definePageMeta({
  pageType: 'list',
});

const route = useRoute();

const executionId = computed(() => route.params.id as string);

// ─── Mock Data (replace with real repository call) ─────────────────
interface NodeExecution {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  activityName: string | null;
  status: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  retryCount: number;
  retryErrors: string[] | null;
  executionOrder: number;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
}

interface ExecutionDetail {
  id: string;
  workflowId: string;
  workflowName: string;
  group: string;
  status: string;
  startTime: string;
  endTime: string | null;
  durationMs: number;
  childExecutionIds: string[] | null;
  cascadeCancellation: boolean;
  idempotencyKey: string | null;
  replayOf: string | null;
  errors: string[] | null;
  errorCount: number;
  isTestRun: boolean;
  nodeExecutions: NodeExecution[];
}

interface ExecutionDetailsResponse {
  execution: ExecutionDetail;
  orchestrationStatus: string;
  canCancel: boolean;
  canPause: boolean;
  canReplay: boolean;
}

const mockData: ExecutionDetailsResponse = {
  execution: {
    id: 'sub-sched-9b532611-36af-4215-a108-4da6d37886d8-20260413084500-9efab11892e35c68bd06091c0aacd0c4',
    workflowId: '359d6d54-8fbc-4285-95bc-743685514d8d',
    workflowName: 'Monitor Incremental Order Sync',
    group: 'Monitor ERP Sync',
    status: 'completed',
    startTime: '2026-04-13T08:46:45.2089808Z',
    endTime: '2026-04-13T08:46:46.7399042Z',
    durationMs: 1530,
    childExecutionIds: null,
    cascadeCancellation: true,
    idempotencyKey: null,
    replayOf: null,
    errors: null,
    errorCount: 0,
    isTestRun: false,
    nodeExecutions: [
      { nodeId: 'authenticate', nodeName: 'Authenticate with Monitor', nodeType: 'action', activityName: 'MonitorSessionAction', status: 'completed', startTime: '2026-04-13T08:46:45.3877928Z', endTime: '2026-04-13T08:46:45.9806118Z', durationMs: 592, retryCount: 0, retryErrors: null, executionOrder: 0, input: null, output: null },
      { nodeId: 'fetch-countries', nodeName: 'Fetch Countries', nodeType: 'action', activityName: 'HttpRequestAction', status: 'completed', startTime: '2026-04-13T08:46:45.9806118Z', endTime: '2026-04-13T08:46:46.1223153Z', durationMs: 141, retryCount: 0, retryErrors: null, executionOrder: 1, input: null, output: null },
      { nodeId: 'fetch-currencies', nodeName: 'Fetch Currencies', nodeType: 'action', activityName: 'HttpRequestAction', status: 'completed', startTime: '2026-04-13T08:46:46.1223153Z', endTime: '2026-04-13T08:46:46.2537594Z', durationMs: 131, retryCount: 0, retryErrors: null, executionOrder: 2, input: null, output: null },
      { nodeId: 'fetch-vat-rates', nodeName: 'Fetch VAT Rates', nodeType: 'action', activityName: 'HttpRequestAction', status: 'completed', startTime: '2026-04-13T08:46:46.2537594Z', endTime: '2026-04-13T08:46:46.372087Z', durationMs: 118, retryCount: 0, retryErrors: null, executionOrder: 3, input: null, output: null },
      { nodeId: 'load-watermark', nodeName: 'Load Watermark', nodeType: 'action', activityName: 'ReadDocumentAction', status: 'completed', startTime: '2026-04-13T08:46:46.372087Z', endTime: '2026-04-13T08:46:46.463058Z', durationMs: 90, retryCount: 0, retryErrors: null, executionOrder: 4, input: null, output: null },
      { nodeId: 'check-watermark-exists', nodeName: 'Check Watermark Exists', nodeType: 'condition', activityName: null, status: 'completed', startTime: '2026-04-13T08:46:46.463058Z', endTime: '2026-04-13T08:46:46.7399042Z', durationMs: 276, retryCount: 0, retryErrors: null, executionOrder: 5, input: null, output: null },
      { nodeId: 'init-pagination', nodeName: 'Initialize Pagination', nodeType: 'action', activityName: 'TransformAction', status: 'completed', startTime: '2026-04-13T08:46:46.463058Z', endTime: '2026-04-13T08:46:46.532791Z', durationMs: 69, retryCount: 0, retryErrors: null, executionOrder: 6, input: null, output: null },
      { nodeId: 'fetch-changes', nodeName: 'Fetch Order Changes', nodeType: 'action', activityName: 'HttpRequestAction', status: 'completed', startTime: '2026-04-13T08:46:46.532791Z', endTime: '2026-04-13T08:46:46.6477453Z', durationMs: 114, retryCount: 0, retryErrors: null, executionOrder: 7, input: null, output: null },
      { nodeId: 'check-has-changes', nodeName: 'Check Has Changes', nodeType: 'condition', activityName: null, status: 'completed', startTime: '2026-04-13T08:46:46.6477453Z', endTime: '2026-04-13T08:46:46.7399042Z', durationMs: 92, retryCount: 0, retryErrors: null, executionOrder: 8, input: null, output: null },
      { nodeId: 'done', nodeName: 'Sync Complete', nodeType: 'action', activityName: 'TransformAction', status: 'completed', startTime: '2026-04-13T08:46:46.6477453Z', endTime: '2026-04-13T08:46:46.7399042Z', durationMs: 92, retryCount: 0, retryErrors: null, executionOrder: 9, input: null, output: null },
    ],
  },
  orchestrationStatus: 'Completed',
  canCancel: false,
  canPause: false,
  canReplay: true,
};

const details = ref<ExecutionDetailsResponse>(mockData);
const execution = computed(() => details.value.execution);
const isRunning = computed(() => execution.value.status?.toLowerCase() === 'running');

// ─── Formatters ────────────────────────────────────────────────────
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
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
const timelineStart = computed(() => new Date(execution.value.startTime).getTime());
const timelineEnd = computed(() => {
  if (execution.value.endTime) return new Date(execution.value.endTime).getTime();
  const last = execution.value.nodeExecutions.reduce((acc, n) => {
    const t = n.endTime ? new Date(n.endTime).getTime() : 0;
    return t > acc ? t : acc;
  }, 0);
  return last || timelineStart.value + execution.value.durationMs;
});
const timelineSpan = computed(() => Math.max(1, timelineEnd.value - timelineStart.value));

const nodeBarStyle = (node: NodeExecution) => {
  const start = new Date(node.startTime).getTime() - timelineStart.value;
  const end = (node.endTime ? new Date(node.endTime).getTime() : timelineEnd.value) - timelineStart.value;
  const left = (start / timelineSpan.value) * 100;
  const width = Math.max(0.5, ((end - start) / timelineSpan.value) * 100);
  return { left: `${left}%`, width: `${width}%` };
};

// ─── Selected node ─────────────────────────────────────────────────
const selectedNode = ref<NodeExecution | null>(null);

// ─── Actions (mock handlers) ───────────────────────────────────────
const { toast } = useToast();

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    icon: LucideSquare,
    variant: 'destructive' as const,
    disabled: !details.value.canCancel,
    handler: () => toast({ title: 'Cancel requested', description: 'Mock action — hook up repository' }),
  },
  {
    id: 'pause',
    label: 'Pause',
    icon: LucidePause,
    variant: 'outline' as const,
    disabled: !details.value.canPause,
    handler: () => toast({ title: 'Pause requested', description: 'Mock action — hook up repository' }),
  },
  {
    id: 'replay',
    label: 'Replay',
    icon: LucideRepeat,
    variant: 'default' as const,
    disabled: !details.value.canReplay,
    handler: () => toast({ title: 'Replay requested', description: 'Mock action — hook up repository' }),
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: LucideRefreshCw,
    variant: 'ghost' as const,
    disabled: false,
    handler: () => toast({ title: 'Refreshed', description: 'Mock refresh — hook up repository' }),
  },
]);

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
  for (const node of execution.value.nodeExecutions) {
    consoleLines.value.push({
      id: ++logCounter,
      timestamp: formatTime(node.startTime),
      level: 'info',
      source: node.nodeId,
      message: `▶ ${node.nodeName} started${node.activityName ? ` (${node.activityName})` : ''}`,
    });
    if (node.status === 'completed') {
      consoleLines.value.push({
        id: ++logCounter,
        timestamp: formatTime(node.endTime),
        level: 'info',
        source: node.nodeId,
        message: `✔ ${node.nodeName} completed in ${formatDuration(node.durationMs)}`,
      });
    }
    else if (node.status === 'failed') {
      consoleLines.value.push({
        id: ++logCounter,
        timestamp: formatTime(node.endTime),
        level: 'error',
        source: node.nodeId,
        message: `✖ ${node.nodeName} failed`,
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

seedLogs();

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
  <div class="flex h-full flex-col gap-4">
    <ContentHeader :title="execution.workflowName" :description="execution.id">
      <template #title>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <component :is="resolveStatusIcon(execution.status).icon"
              :class="['h-5 w-5', resolveStatusIcon(execution.status).class]" />
            <h1 class="text-xl font-semibold">
              {{ execution.workflowName }}
            </h1>
            <span v-if="execution.isTestRun"
              class="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
              Test run
            </span>
          </div>
          <div class="text-muted-foreground font-mono text-xs">
            {{ execution.id }}
          </div>
          <div class="text-muted-foreground flex items-center gap-2 text-xs">
            <NuxtLink :to="`/orchestrator/workflows/${execution.workflowId}`" class="hover:text-foreground underline">
              {{ execution.group || 'Workflow' }}
            </NuxtLink>
            <span>•</span>
            <span>Status: <span class="text-foreground font-medium capitalize">{{ details.orchestrationStatus }}</span></span>
          </div>
        </div>
      </template>
      <ContentActionBar>
        <Button v-for="action in actions" :key="action.id" :variant="action.variant" size="sm"
          :disabled="action.disabled" @click="action.handler">
          <component :is="action.icon" class="h-4 w-4" />
          {{ action.label }}
        </Button>
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
        <div class="text-muted-foreground text-xs">
          Duration
        </div>
        <div class="font-mono text-sm">
          {{ formatDuration(execution.durationMs) }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          Errors
        </div>
        <div class="font-mono text-sm" :class="execution.errorCount > 0 ? 'text-destructive' : ''">
          {{ execution.errorCount }}
        </div>
      </div>
    </div>

    <!-- Main content: nodes + console -->
    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Node executions timeline -->
      <div class="flex min-h-0 flex-col overflow-hidden rounded-lg border lg:col-span-1">
        <div class="flex items-center justify-between border-b px-4 py-2">
          <h2 class="text-sm font-medium">
            Node Executions
          </h2>
          <span class="text-muted-foreground text-xs">
            {{ execution.nodeExecutions.length }} nodes
          </span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-for="node in execution.nodeExecutions" :key="node.nodeId"
            class="hover:bg-muted/50 border-b px-4 py-3 transition-colors"
            :class="{ 'bg-muted/50': selectedNode?.nodeId === node.nodeId }">
            <button class="w-full text-left" @click="selectedNode = selectedNode?.nodeId === node.nodeId ? null : node">
              <div class="flex items-center gap-3">
                <component :is="selectedNode?.nodeId === node.nodeId ? LucideChevronDown : LucideChevronRight"
                  class="text-muted-foreground h-4 w-4 shrink-0" />
                <component :is="resolveStatusIcon(node.status).icon"
                  :class="['h-4 w-4 shrink-0', resolveStatusIcon(node.status).class]" />
                <span class="text-muted-foreground font-mono text-xs tabular-nums">
                  #{{ node.executionOrder }}
                </span>
                <span class="flex-1 truncate text-sm font-medium">{{ node.nodeName }}</span>
                <span class="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
                  {{ node.nodeType }}
                </span>
                <span class="text-muted-foreground w-16 text-right font-mono text-xs">
                  {{ formatDuration(node.durationMs) }}
                </span>
              </div>

              <!-- Timeline bar -->
              <div class="bg-muted relative mt-2 ml-7 h-1.5 overflow-hidden rounded">
                <div class="absolute top-0 h-full rounded" :style="nodeBarStyle(node)"
                  :class="{
                    'bg-green-500': node.status === 'completed',
                    'bg-destructive': node.status === 'failed',
                    'bg-blue-500': node.status === 'running',
                    'bg-muted-foreground': node.status === 'canceled' || node.status === 'cancelled',
                  }" />
              </div>
            </button>

            <!-- Expanded details -->
            <div v-if="selectedNode?.nodeId === node.nodeId" class="mt-3 ml-7 space-y-2 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <div class="text-muted-foreground">
                    Activity
                  </div>
                  <div class="font-mono">
                    {{ node.activityName ?? '–' }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">
                    Retries
                  </div>
                  <div class="font-mono">
                    {{ node.retryCount }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">
                    Started
                  </div>
                  <div class="font-mono">
                    {{ formatTime(node.startTime) }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">
                    Ended
                  </div>
                  <div class="font-mono">
                    {{ formatTime(node.endTime) }}
                  </div>
                </div>
              </div>
              <div v-if="node.input">
                <div class="text-muted-foreground mb-1">
                  Input
                </div>
                <pre class="bg-muted max-h-40 overflow-auto rounded p-2 font-mono text-xs">{{ JSON.stringify(node.input, null, 2) }}</pre>
              </div>
              <div v-if="node.output">
                <div class="text-muted-foreground mb-1">
                  Output
                </div>
                <pre class="bg-muted max-h-40 overflow-auto rounded p-2 font-mono text-xs">{{ JSON.stringify(node.output, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live console -->
      <div class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 lg:col-span-2">
        <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full"
              :class="isRunning ? 'animate-pulse bg-green-400' : 'bg-zinc-600'" />
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
