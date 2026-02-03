<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Repeat } from 'lucide-vue-next'

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
    class="px-4 py-3 rounded-lg border-2 bg-background shadow-md min-w-[180px] transition-all"
    :class="selected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3 !h-3 !bg-purple-500 !border-2 !border-background"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
        <Repeat class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium text-purple-500 uppercase tracking-wider">Loop</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Loop config preview -->
    <div v-if="data.config?.itemsField" class="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
      Iterate: {{ data.config.itemsField }}
      <span v-if="data.config.batchSize"> (batch: {{ data.config.batchSize }})</span>
    </div>
    
    <!-- Loop body output handle -->
    <Handle
      id="loop"
      type="source"
      :position="Position.Right"
      :style="{ top: '30%' }"
      class="!w-3 !h-3 !bg-purple-500 !border-2 !border-background"
    />
    
    <!-- Done output handle -->
    <Handle
      id="done"
      type="source"
      :position="Position.Right"
      :style="{ top: '70%' }"
      class="!w-3 !h-3 !bg-gray-400 !border-2 !border-background"
    />

    <!-- Labels for handles -->
    <div class="absolute -right-1 top-[25%] text-[10px] text-purple-500 font-medium translate-x-full px-1">
      Each
    </div>
    <div class="absolute -right-1 top-[65%] text-[10px] text-gray-400 font-medium translate-x-full px-1">
      Done
    </div>
  </div>
</template>
