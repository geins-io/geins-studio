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

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('Workflow'))

const workflowName = computed(() => props.data.config?.workflowName || props.data.config?.workflowId)
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-teal-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      :style="{ top: '25%' }"
      class="!border-background !h-[15px] !w-[15px] !border-2 !bg-teal-500"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-teal-500 uppercase">Workflow</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Sub-workflow preview -->
    <div v-if="workflowName" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      Runs: {{ workflowName }}
    </div>

    <!-- Output handle -->
    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-teal-500"
    />
  </div>
</template>
