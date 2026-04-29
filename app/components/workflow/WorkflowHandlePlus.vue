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

const isHovered = ref(false)

const isPlusVisible = computed(() => !isConnecting.value || isHovered.value)

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
    <Transition name="handle-plus">
      <div
        v-if="!isConnected"
        v-show="isPlusVisible"
        class="pointer-events-none absolute left-1/2 top-1/2 flex -translate-y-1/2 items-center"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Connecting line from handle dot to + button -->
        <div class="h-[2px] w-[24px] bg-muted-foreground/40" />
        <!-- + button -->
        <div
          class="nodrag pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all hover:scale-110 hover:border-foreground/30 hover:text-foreground"
          @click="onClick"
        >
          <LucidePlus class="h-3 w-3" />
        </div>
      </div>
    </Transition>
  </Handle>
</template>

<style scoped>
.handle-plus-enter-active,
.handle-plus-leave-active {
  transform-origin: left center;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.handle-plus-enter-from,
.handle-plus-leave-to {
  transform: translateY(-50%) scale(0);
  opacity: 0;
}
</style>
