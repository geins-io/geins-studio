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

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('BookOpen'))

const pageDisplay = computed(() => {
  const size = props.data.config?.pageSize
  if (!size) return null
  const max = props.data.config?.maxPages
  return max ? `${size} per page (max: ${max})` : `${size} per page`
})
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      :style="{ top: '25%' }"
      class="!border-background !h-[15px] !w-[15px] !border-2 !bg-indigo-500"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-indigo-500 uppercase">Paginator</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Paginator config preview -->
    <div v-if="pageDisplay" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      {{ pageDisplay }}
    </div>

    <!-- Page output handle -->
    <WorkflowHandlePlus
      handle-id="page"
      :style="{ top: '30%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-indigo-500"
    />

    <!-- Done output handle -->
    <WorkflowHandlePlus
      handle-id="done"
      :style="{ top: '70%' }"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-gray-400"
    />

    <!-- Labels for handles -->
    <div class="absolute top-[25%] -right-1 translate-x-full px-1 text-[10px] font-medium text-indigo-500">
      Page
    </div>
    <div class="absolute top-[65%] -right-1 translate-x-full px-1 text-[10px] font-medium text-gray-400">
      Done
    </div>
  </div>
</template>
