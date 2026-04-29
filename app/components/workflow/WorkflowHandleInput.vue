<script setup lang="ts">
import { Handle, Position, useNode, useVueFlow } from '@vue-flow/core'

const props = withDefaults(defineProps<{
  handleClass?: string
  style?: Record<string, string>
}>(), {})

const { id: nodeId } = useNode()
const { edges, connectionStartHandle } = useVueFlow()

const isConnected = computed(() =>
  edges.value.some(e => e.target === nodeId),
)

const isValidTarget = computed(() => {
  const start = connectionStartHandle.value
  if (!start) return false
  if (start.nodeId === nodeId) return false
  const alreadyConnected = edges.value.some(
    e => e.source === start.nodeId && e.target === nodeId,
  )
  return !alreadyConnected
})
</script>

<template>
  <Handle
    type="target"
    :position="Position.Left"
    :style="style"
    :class="[handleClass, isConnected ? 'tear' : '', isValidTarget ? 'pulse-handle' : '']"
  />
</template>

<style scoped>
.tear {
  border-radius: 50% 50% 50% 0 !important;
  transform: translate(-50%, -50%) rotate(45deg) !important;
}

.pulse-handle {
  animation: handle-pulse 1.2s ease-in-out infinite;
}

@keyframes handle-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 currentColor;
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 0 6px transparent;
    opacity: 0.7;
  }
}
</style>
