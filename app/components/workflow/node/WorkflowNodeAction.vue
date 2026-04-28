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

const { resolveIcon } = useLucideIcon()

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('Zap'))
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!border-background !h-3 !w-3 !border-2 !bg-blue-500"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-blue-500 uppercase">Action</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>
    
    <!-- Output handle -->
    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-blue-500"
    />
  </div>
</template>
