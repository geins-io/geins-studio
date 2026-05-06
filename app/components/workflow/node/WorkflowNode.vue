<script setup lang="ts">
import WorkflowNodeAction from './WorkflowNodeAction.vue'
import WorkflowNodeCondition from './WorkflowNodeCondition.vue'
import WorkflowNodeDelay from './WorkflowNodeDelay.vue'
import WorkflowNodeIterator from './WorkflowNodeIterator.vue'
import WorkflowNodePaginator from './WorkflowNodePaginator.vue'
import WorkflowNodeToolbar from './WorkflowNodeToolbar.vue'
import WorkflowNodeTrigger from './WorkflowNodeTrigger.vue'
import WorkflowNodeWorkflow from './WorkflowNodeWorkflow.vue'
import type { Component } from 'vue'

type NodeExecData = { input?: Record<string, unknown> | null, output?: Record<string, unknown> | null, status?: string, error?: string | null }

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  type: string
  id: string
  selected?: boolean
}>()

const NODE_COMPONENTS: Record<string, Component> = {
  trigger: WorkflowNodeTrigger,
  action: WorkflowNodeAction,
  condition: WorkflowNodeCondition,
  iterator: WorkflowNodeIterator,
  loop: WorkflowNodeIterator,
  delay: WorkflowNodeDelay,
  workflow: WorkflowNodeWorkflow,
  paginator: WorkflowNodePaginator,
}

const componentForType = computed(() => NODE_COMPONENTS[props.type] ?? WorkflowNodeAction)

const lastNodeExecutions = inject<Ref<Map<string, NodeExecData>>>('lastNodeExecutions')
const hasFailed = computed(() => lastNodeExecutions?.value?.get(props.id)?.status === 'failed')
</script>

<template>
  <div class="relative">
    <WorkflowNodeToolbar
      v-if="props.type !== 'trigger'"
      :node-id="props.id"
      :visible="!!props.selected"
    />
    <!-- Persistent failure badge visible even when node is not selected -->
    <div
      v-if="hasFailed"
      class="bg-destructive text-destructive-foreground absolute -top-2 -right-2 z-40 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
    >
      <LucideTriangleAlert class="h-3 w-3" />
    </div>
    <component :is="componentForType" v-bind="$attrs" :selected="props.selected" />
  </div>
</template>
