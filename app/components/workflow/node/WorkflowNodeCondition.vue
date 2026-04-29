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
    class="bg-background flex min-h-[100px] min-w-[180px] flex-col justify-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-yellow-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      :style="{ top: '25%' }"
      class="!border-background !h-[15px] !w-[15px] !border-2 !bg-yellow-500"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
        <LucideGitBranch class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-yellow-500 uppercase">Condition</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Condition preview -->
    <div v-if="data.config?.field" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      {{ data.config.field }} {{ data.config.operator }} "{{ data.config.value }}"
    </div>
    
    <!-- True output handle -->
    <WorkflowHandlePlus
      handle-id="true"
      :style="{ top: '30%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-green-500"
    />

    <!-- False output handle -->
    <WorkflowHandlePlus
      handle-id="false"
      :style="{ top: '70%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-red-500"
    />

    <!-- Labels for handles -->
    <div class="bg-background/80 absolute top-[25%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-green-500">
      Yes
    </div>
    <div class="bg-background/80 absolute top-[65%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-red-500">
      No
    </div>
  </div>
</template>
