<script setup lang="ts">
import type { ExecutionNodeExecution } from '#shared/types';
import { formatDuration, formatTimestamp } from '#shared/utils/time';
import {
  LucideChevronRight,
  LucideChevronDown,
} from '#components';

interface Props {
  nodes: ExecutionNodeExecution[];
  timelineStart?: number | null;
  timelineEnd?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  timelineStart: null,
  timelineEnd: null,
});

const { resolveStatusIcon } = useExecutionStatus();

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

const timelineSpan = computed(() => Math.max(1, derivedEnd.value - derivedStart.value));

const nodeBarStyle = (node: ExecutionNodeExecution) => {
  if (!node.startTime) return { left: '0%', width: '0%' };
  const start = new Date(node.startTime).getTime() - derivedStart.value;
  const end = (node.endTime ? new Date(node.endTime).getTime() : derivedEnd.value) - derivedStart.value;
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
</script>

<template>
  <div class="flex flex-col rounded-lg border">
    <div class="flex items-center justify-between border-b px-4 py-2">
      <h2 class="text-sm font-medium">
        Node Executions
      </h2>
      <span class="text-muted-foreground text-xs">
        {{ nodes.length }} nodes
      </span>
    </div>
    <div v-if="nodes.length === 0" class="text-muted-foreground p-4 text-center text-sm">
      No node executions
    </div>
    <div v-else>
      <div
        v-for="node in nodes"
        :key="node.nodeId"
        class="hover:bg-muted/50 border-b px-4 py-3 transition-colors"
      >
        <button
          class="w-full cursor-pointer text-left focus:outline-none focus-visible:outline-none"
          @click="toggleNodeExpanded(node.nodeId)"
        >
          <div class="flex items-center gap-3">
            <component
              :is="isNodeExpanded(node.nodeId) ? LucideChevronDown : LucideChevronRight"
              class="text-muted-foreground h-4 w-4 shrink-0"
            />
            <component
              :is="resolveStatusIcon(node.status).icon"
              :class="['h-4 w-4 shrink-0', resolveStatusIcon(node.status).class]"
            />
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

          <div class="bg-muted relative mt-2 ml-7 h-1.5 overflow-hidden rounded">
            <div
              class="absolute top-0 h-full rounded"
              :style="nodeBarStyle(node)"
              :class="{
                'bg-green-500': node.status === 'completed',
                'bg-destructive': node.status === 'failed',
                'bg-blue-500': node.status === 'running',
                'bg-muted-foreground': node.status === 'canceled' || node.status === 'cancelled',
              }"
            />
          </div>
        </button>

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
              <dd class="font-mono capitalize select-all">
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
                {{ formatTimestamp(node.startTime) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                Ended
              </dt>
              <dd class="font-mono select-all">
                {{ formatTimestamp(node.endTime) }}
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
</template>
