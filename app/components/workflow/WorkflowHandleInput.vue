<script setup lang="ts">
import { Handle, Position, useNode, useVueFlow } from '@vue-flow/core'

const props = withDefaults(defineProps<{
  handleClass?: string
  style?: Record<string, string>
}>(), {})

const { id: nodeId } = useNode()
const { edges } = useVueFlow()

const isConnected = computed(() =>
  edges.value.some(e => e.target === nodeId),
)
</script>

<template>
  <Handle
    type="target"
    :position="Position.Left"
    :style="style"
    :class="[handleClass, isConnected ? 'tear' : '']"
  />
</template>

<style scoped>
.tear {
  border-radius: 50% 50% 50% 0 !important;
  transform: translate(-50%, -50%) rotate(45deg) !important;
}
</style>
