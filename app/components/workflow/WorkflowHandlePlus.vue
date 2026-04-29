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
const { edges, connectionStartHandle } = useVueFlow()

const onHandlePlusClick = inject<(sourceNodeId: string, sourceHandleId?: string) => void>('onHandlePlusClick')

const isConnected = computed(() =>
  edges.value.some(
    e => e.source === nodeId && (props.handleId == null || e.sourceHandle === props.handleId),
  ),
)

const isConnecting = computed(() => connectionStartHandle.value !== null)

const showPlus = computed(() => !isConnected.value && !isConnecting.value)

const onClick = (event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
  onHandlePlusClick?.(nodeId, props.handleId)
}
</script>

<template>
  <Handle
    :id="handleId"
    type="source"
    :position="position"
    :style="style"
    :class="[handleClass, '!overflow-visible']"
  >
    <template v-if="showPlus">
      <!-- Connecting line from handle dot to + button -->
      <div class="nodrag pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[24px] -translate-y-1/2 bg-muted-foreground/40" />
      <!-- + button (inside Handle so drag starts a connection) -->
      <div
        class="nodrag absolute left-[calc(50%+24px)] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all hover:scale-110 hover:border-foreground/30 hover:text-foreground"
        @click="onClick"
      >
        <LucidePlus class="h-3 w-3" />
      </div>
    </template>
  </Handle>
</template>
