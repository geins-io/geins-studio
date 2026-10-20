<script setup lang="ts">
import WorkflowNodeAction from './WorkflowNodeAction.vue';
import WorkflowNodeCondition from './WorkflowNodeCondition.vue';
import WorkflowNodeDelay from './WorkflowNodeDelay.vue';
import WorkflowNodeIterator from './WorkflowNodeIterator.vue';
import WorkflowNodePaginator from './WorkflowNodePaginator.vue';
import WorkflowNodeToolbar from './WorkflowNodeToolbar.vue';
import WorkflowNodeTrigger from './WorkflowNodeTrigger.vue';
import WorkflowNodeWorkflow from './WorkflowNodeWorkflow.vue';
import type { Component } from 'vue';

type NodeExecData = {
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  status?: string;
  error?: string | null;
};

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  type: string;
  id: string;
  selected?: boolean;
}>();

const NODE_COMPONENTS: Record<string, Component> = {
  trigger: WorkflowNodeTrigger,
  action: WorkflowNodeAction,
  condition: WorkflowNodeCondition,
  iterator: WorkflowNodeIterator,
  loop: WorkflowNodeIterator,
  delay: WorkflowNodeDelay,
  workflow: WorkflowNodeWorkflow,
  paginator: WorkflowNodePaginator,
};

const componentForType = computed(
  () => NODE_COMPONENTS[props.type] ?? WorkflowNodeAction,
);

const lastNodeExecutions =
  inject<Ref<Map<string, NodeExecData>>>('lastNodeExecutions');
const nodeExec = computed(() => lastNodeExecutions?.value?.get(props.id));
const nodeExecStatus = computed(() => nodeExec.value?.status?.toLowerCase());
const { isFailedStatus } = useExecutionStatus();
const hasFailed = computed(() => isFailedStatus(nodeExecStatus.value));
const hasSucceeded = computed(() => nodeExecStatus.value === 'completed');
</script>

<template>
  <div class="relative">
    <WorkflowNodeToolbar
      v-if="props.type !== 'trigger'"
      :node-id="props.id"
      :visible="!!props.selected"
    />
    <TooltipProvider v-if="hasFailed" :delay-duration="100">
      <Tooltip>
        <TooltipTrigger as-child>
          <div
            class="bg-destructive text-destructive-foreground absolute -top-2 -right-2 z-40 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
          >
            <LucideTriangleAlert class="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent
          v-if="nodeExec?.error"
          class="max-w-sm font-mono text-xs wrap-break-word whitespace-pre-wrap"
        >
          {{ nodeExec.error }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div
      v-else-if="hasSucceeded"
      class="absolute -top-2 -right-2 z-40 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
    >
      <LucideCheck class="h-3 w-3" />
    </div>
    <component
      :is="componentForType"
      v-bind="$attrs"
      :selected="props.selected"
    />
  </div>
</template>
