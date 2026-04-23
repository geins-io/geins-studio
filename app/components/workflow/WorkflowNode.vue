<script setup lang="ts">
// Single entry-point for workflow canvas nodes. VueFlow forwards the node's
// `type` to this component, which dispatches to the matching component in
// ./nodes. Centralizing the type→component mapping keeps the canvas host
// (WorkflowBuilder) decoupled from individual node implementations — adding
// a new node type only requires a new file in ./nodes plus an entry below.
import WorkflowNodeAction from './node/WorkflowNodeAction.vue'
import WorkflowNodeCondition from './node/WorkflowNodeCondition.vue'
import WorkflowNodeDelay from './node/WorkflowNodeDelay.vue'
import WorkflowNodeLoop from './node/WorkflowNodeLoop.vue'
import WorkflowNodeTrigger from './node/WorkflowNodeTrigger.vue'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  type: string
}>()

const NODE_COMPONENTS: Record<string, Component> = {
  trigger: WorkflowNodeTrigger,
  action: WorkflowNodeAction,
  condition: WorkflowNodeCondition,
  loop: WorkflowNodeLoop,
  delay: WorkflowNodeDelay,
}

// Fall back to the action node so an unrecognized type still renders visibly
// on the canvas instead of silently disappearing.
const componentForType = computed(() => NODE_COMPONENTS[props.type] ?? WorkflowNodeAction)
</script>

<template>
  <component :is="componentForType" v-bind="$attrs" />
</template>
