<script setup lang="ts">
import { Handle, Position, useNode, useVueFlow } from '@vue-flow/core'

const props = withDefaults(defineProps<{
  handleId?: string
  position?: Position
  style?: Record<string, string>
  handleClass?: string
}>(), {
  position: Position.Right,
})

const { id: nodeId } = useNode()
const { edges } = useVueFlow()

const onHandlePlusClick = inject<(sourceNodeId: string, sourceHandleId?: string) => void>('onHandlePlusClick')

const isConnected = computed(() =>
  edges.value.some(
    e => e.source === nodeId && (props.handleId == null || e.sourceHandle === props.handleId),
  ),
)

const buttonStyle = computed(() => {
  const top = props.style?.top ?? '50%'
  return { top }
})

const onClick = (event: MouseEvent) => {
  event.stopPropagation()
  onHandlePlusClick?.(nodeId, props.handleId)
}
</script>

<template>
  <Handle
    :id="handleId"
    type="source"
    :position="position"
    :style="style"
    :class="handleClass"
  />
  <!-- Connecting line from handle to + button -->
  <div
    v-if="!isConnected"
    class="absolute -right-[24px] h-[2px] w-[24px] -translate-y-1/2 bg-muted-foreground/40"
    :style="buttonStyle"
  />
  <button
    v-if="!isConnected"
    class="nopan nodrag absolute right-0 flex h-6 w-6 -translate-y-1/2 translate-x-[calc(100%+16px)] items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all hover:scale-110 hover:border-foreground/30 hover:text-foreground"
    :style="buttonStyle"
    @click="onClick"
    @mousedown.stop
  >
    <LucidePlus class="h-3 w-3" />
  </button>
</template>
