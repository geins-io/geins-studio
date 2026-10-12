<script setup lang="ts">
import type { ExecutionLog, ExecutionNodeExecution } from '#shared/types';
import { formatDuration, formatTimestamp } from '#shared/utils/time';
import { LucideChevronRight, LucideChevronDown } from '#components';

interface Props {
  nodes: ExecutionNodeExecution[];
  timelineStart?: number | null;
  timelineEnd?: number | null;
  execution?: Pick<ExecutionLog, 'error' | 'errors'> | null;
}

const props = withDefaults(defineProps<Props>(), {
  timelineStart: null,
  timelineEnd: null,
  execution: null,
});

const { resolveStatusIcon, isFailedStatus } = useExecutionStatus();
const { errorForNode } = useExecutionErrors();

const statusOf = (node: ExecutionNodeExecution) =>
  node.status?.toLowerCase() ?? '';
const isFailed = (node: ExecutionNodeExecution) => isFailedStatus(node.status);

const derivedStart = computed(() => {
  if (props.timelineStart != null) return props.timelineStart;
  const starts = props.nodes
    .map((n) => (n.startTime ? new Date(n.startTime).getTime() : 0))
    .filter((t) => t > 0);
  return starts.length ? Math.min(...starts) : 0;
});

const derivedEnd = computed(() => {
  if (props.timelineEnd != null) return props.timelineEnd;
  const ends = props.nodes
    .map((n) => (n.endTime ? new Date(n.endTime).getTime() : 0))
    .filter((t) => t > 0);
  return ends.length ? Math.max(...ends) : derivedStart.value;
});

const timelineSpan = computed(() =>
  Math.max(1, derivedEnd.value - derivedStart.value),
);

const nodeBarStyle = (node: ExecutionNodeExecution) => {
  if (!node.startTime) return { left: '0%', width: '0%' };
  const start = new Date(node.startTime).getTime() - derivedStart.value;
  const end =
    (node.endTime ? new Date(node.endTime).getTime() : derivedEnd.value) -
    derivedStart.value;
  const left = (start / timelineSpan.value) * 100;
  const width = Math.max(0.5, ((end - start) / timelineSpan.value) * 100);
  return { left: `${left}%`, width: `${width}%` };
};

const expandedNodeIds = ref<Set<string>>(new Set());

const isNodeExpanded = (nodeId: string) => expandedNodeIds.value.has(nodeId);

const toggleNodeExpanded = (nodeId: string) => {
  const next = new Set(expandedNodeIds.value);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  expandedNodeIds.value = next;
};

const expandNode = (nodeId: string) => {
  if (isNodeExpanded(nodeId)) return;
  expandedNodeIds.value = new Set(expandedNodeIds.value).add(nodeId);
};

const rows = computed(() =>
  props.nodes.map((node) => {
    const error = errorForNode(props.execution, node);
    const retries = node.retryErrors ?? [];
    const errorMessage =
      error?.message ?? (isFailed(node) ? (retries.at(-1) ?? null) : null);
    return {
      node,
      error,
      errorMessage,
      // The final attempt is usually the failure shown above the list.
      failedAttempts:
        errorMessage && retries.at(-1) === errorMessage
          ? retries.slice(0, -1)
          : retries,
    };
  }),
);

const failedNodeId = computed(
  () =>
    props.execution?.error?.failedNodeId ??
    props.nodes.find(isFailed)?.nodeId ??
    null,
);

// Auto-expand once per failing node; polling re-renders must not re-open a
// step the user has collapsed.
const autoExpanded = new Set<string>();
watch(
  failedNodeId,
  (nodeId) => {
    if (!nodeId || autoExpanded.has(nodeId)) return;
    autoExpanded.add(nodeId);
    expandNode(nodeId);
  },
  { immediate: true },
);

const nodeElementId = (nodeId: string) => `node-execution-${nodeId}`;

const focusNode = async (nodeId: string) => {
  expandNode(nodeId);
  await nextTick();
  document
    .getElementById(nodeElementId(nodeId))
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

defineExpose({ focusNode });
</script>

<template>
  <div
    class="bg-secondary/50 dark:bg-secondary/70 flex flex-col rounded-lg border shadow-xs"
  >
    <div
      class="bg-card flex items-center justify-between rounded-t-lg border-b px-4 py-2"
    >
      <h2 class="text-sm font-medium">
        {{ $t('orchestrator.node_executions.title') }}
      </h2>
      <span class="text-muted-foreground text-xs">
        {{ $t('workflows.nodes', { count: nodes.length }) }}
      </span>
    </div>
    <div
      v-if="nodes.length === 0"
      class="text-muted-foreground p-4 text-center text-sm"
    >
      {{ $t('orchestrator.node_executions.empty') }}
    </div>
    <div v-else>
      <div
        v-for="{ node, error, errorMessage, failedAttempts } in rows"
        :id="nodeElementId(node.nodeId)"
        :key="node.nodeId"
        class="scroll-mt-4 border-b px-4 py-3"
      >
        <button
          class="w-full cursor-pointer text-left focus:outline-none focus-visible:outline-none"
          @click="toggleNodeExpanded(node.nodeId)"
        >
          <div class="flex items-center gap-3">
            <component
              :is="
                isNodeExpanded(node.nodeId)
                  ? LucideChevronDown
                  : LucideChevronRight
              "
              class="text-muted-foreground h-4 w-4 shrink-0"
            />
            <component
              :is="resolveStatusIcon(node.status).icon"
              :class="[
                'h-4 w-4 shrink-0',
                resolveStatusIcon(node.status).class,
              ]"
            />
            <span class="text-muted-foreground font-mono text-xs tabular-nums">
              #{{ node.executionOrder }}
            </span>
            <span class="flex-1 truncate text-sm font-medium">
              {{ node.nodeName }}
            </span>
            <span
              class="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs"
            >
              {{ node.nodeType }}
            </span>
            <span
              class="text-muted-foreground w-16 text-right font-mono text-xs"
            >
              {{ formatDuration(node.durationMs) }}
            </span>
          </div>

          <p
            v-if="errorMessage && !isNodeExpanded(node.nodeId)"
            class="text-destructive mt-1 ml-7 truncate font-mono text-xs"
          >
            {{ errorMessage }}
          </p>

          <div
            class="bg-muted relative mt-2 ml-7 h-1.5 overflow-hidden rounded"
          >
            <div
              class="absolute top-0 h-full rounded"
              :style="nodeBarStyle(node)"
              :class="{
                'bg-green-500': statusOf(node) === 'completed',
                'bg-destructive': isFailed(node),
                'bg-blue-500': statusOf(node) === 'running',
                'bg-muted-foreground':
                  statusOf(node) === 'canceled' ||
                  statusOf(node) === 'cancelled',
              }"
            />
          </div>
        </button>

        <div
          v-if="isNodeExpanded(node.nodeId)"
          class="mt-3 ml-7 space-y-3 text-xs"
        >
          <OrchestratorExecutionErrorDetails v-if="error" :error="error" />
          <dl class="space-y-1.5">
            <div>
              <dt class="text-muted-foreground">
                {{ $t('orchestrator.node_executions.node_id') }}
              </dt>
              <dd class="font-mono select-all">
                {{ node.nodeId }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ $t('orchestrator.node_executions.activity') }}
              </dt>
              <dd class="font-mono select-all">
                {{ node.activityName ?? '–' }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">{{ $t('status') }}</dt>
              <dd class="font-mono capitalize select-all">
                {{ node.status }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ $t('orchestrator.node_executions.retries') }}
              </dt>
              <dd class="font-mono select-all">
                {{ node.retryCount ?? 0 }}
              </dd>
            </div>
            <div v-if="failedAttempts.length">
              <dt class="text-muted-foreground">
                {{ $t('orchestrator.node_executions.failed_attempts') }}
              </dt>
              <dd>
                <ol class="list-decimal space-y-1 pl-4">
                  <li
                    v-for="(retryError, idx) in failedAttempts"
                    :key="idx"
                    class="text-destructive font-mono wrap-break-word whitespace-pre-wrap"
                  >
                    {{ retryError }}
                  </li>
                </ol>
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ $t('executions.start_time') }}
              </dt>
              <dd class="font-mono select-all">
                {{ formatTimestamp(node.startTime) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ $t('executions.end_time') }}
              </dt>
              <dd class="font-mono select-all">
                {{ formatTimestamp(node.endTime) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ $t('executions.duration') }}
              </dt>
              <dd class="font-mono select-all">
                {{ formatDuration(node.durationMs) }}
              </dd>
            </div>
          </dl>
          <div v-if="node.input">
            <div class="text-muted-foreground mb-1">{{ $t('input', 1) }}</div>
            <pre
              class="bg-muted max-h-40 overflow-auto rounded border p-2 font-mono text-xs"
              >{{ JSON.stringify(node.input, null, 2) }}</pre
            >
          </div>
          <div v-if="node.output">
            <div class="text-muted-foreground mb-1">
              {{ $t('orchestrator.node_executions.output') }}
            </div>
            <pre
              class="bg-muted max-h-40 overflow-auto rounded border p-2 font-mono text-xs"
              >{{ JSON.stringify(node.output, null, 2) }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
