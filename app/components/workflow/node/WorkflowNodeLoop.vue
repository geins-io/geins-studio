<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    config: Record<string, any>
  }
  selected?: boolean
}>()
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!border-background !h-3 !w-3 !border-2 !bg-purple-500"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
        <LucideRepeat class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-purple-500 uppercase">Loop</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Loop config preview -->
    <div v-if="data.config?.itemsField" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      Iterate: {{ data.config.itemsField }}
      <span v-if="data.config.batchSize"> (batch: {{ data.config.batchSize }})</span>
    </div>
    
    <!-- Loop body output handle -->
    <WorkflowHandlePlus
      handle-id="loop"
      :style="{ top: '30%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-purple-500"
    />

    <!-- Done output handle -->
    <WorkflowHandlePlus
      handle-id="done"
      :style="{ top: '70%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-gray-400"
    />

    <!-- Labels for handles -->
    <div class="absolute top-[25%] -right-1 translate-x-full px-1 text-[10px] font-medium text-purple-500">
      Each
    </div>
    <div class="absolute top-[65%] -right-1 translate-x-full px-1 text-[10px] font-medium text-gray-400">
      Done
    </div>
  </div>
</template>
