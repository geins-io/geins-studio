<script setup lang="ts">
// Single entry-point for workflow canvas nodes. VueFlow forwards the node's
// `type` to this component, which dispatches to the matching component in
// ./nodes. Centralizing the type→component mapping keeps the canvas host
// (WorkflowBuilder) decoupled from individual node implementations — adding
// a new node type only requires a new file in ./nodes plus an entry below.
import WorkflowNodeAction from './WorkflowNodeAction.vue'
import WorkflowNodeCondition from './WorkflowNodeCondition.vue'
import WorkflowNodeDelay from './WorkflowNodeDelay.vue'
import WorkflowNodeIterator from './WorkflowNodeIterator.vue'
import WorkflowNodePaginator from './WorkflowNodePaginator.vue'
import WorkflowNodeTrigger from './WorkflowNodeTrigger.vue'
import WorkflowNodeWorkflow from './WorkflowNodeWorkflow.vue'
import WorkflowNodeToolbar from './WorkflowNodeToolbar.vue'
import type { Component } from 'vue'

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

// Fall back to the action node so an unrecognized type still renders visibly
// on the canvas instead of silently disappearing.
const componentForType = computed(() => NODE_COMPONENTS[props.type] ?? WorkflowNodeAction)
</script>

<template>
  <div class="relative">
    <WorkflowNodeToolbar
      v-if="props.type !== 'trigger'"
      :node-id="props.id"
      :visible="!!props.selected"
    />
    <component :is="componentForType" v-bind="$attrs" :selected="props.selected" />
  </div>
</template>
