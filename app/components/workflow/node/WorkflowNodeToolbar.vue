<script setup lang="ts">
const props = defineProps<{
  nodeId: string
  visible: boolean
}>()

const onNodeDelete = inject<(nodeId: string) => void>('onNodeDelete')
const onNodeCopy = inject<(nodeId: string) => void>('onNodeCopy')
const onNodeOpenSettings = inject<(nodeId: string) => void>('onNodeOpenSettings')
</script>

<template>
  <Transition name="toolbar-fade">
    <div
      v-if="props.visible"
      class="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md"
    >
      <button
        class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Open settings"
        @click.stop="onNodeOpenSettings?.(props.nodeId)"
      >
        <LucideSettings class="h-3.5 w-3.5" />
      </button>
      <button
        class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Copy node"
        @click.stop="onNodeCopy?.(props.nodeId)"
      >
        <LucideCopy class="h-3.5 w-3.5" />
      </button>
      <button
        class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete node"
        @click.stop="onNodeDelete?.(props.nodeId)"
      >
        <LucideTrash2 class="h-3.5 w-3.5" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.toolbar-fade-enter-from,
.toolbar-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
