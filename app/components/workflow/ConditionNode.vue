<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'

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
    :class="selected ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-yellow-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3 !h-3 !bg-yellow-500 !border-2 !border-background"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
        <GitBranch class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium text-yellow-500 uppercase tracking-wider">Condition</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Condition preview -->
    <div v-if="data.config?.field" class="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
      {{ data.config.field }} {{ data.config.operator }} "{{ data.config.value }}"
    </div>
    
    <!-- True output handle -->
    <Handle
      id="true"
      type="source"
      :position="Position.Right"
      :style="{ top: '30%' }"
      class="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
    />
    
    <!-- False output handle -->
    <Handle
      id="false"
      type="source"
      :position="Position.Right"
      :style="{ top: '70%' }"
      class="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
    />

    <!-- Labels for handles -->
    <div class="absolute -right-1 top-[25%] text-[10px] text-green-500 font-medium translate-x-full px-1">
      Yes
    </div>
    <div class="absolute -right-1 top-[65%] text-[10px] text-red-500 font-medium translate-x-full px-1">
      No
    </div>
  </div>
</template>
