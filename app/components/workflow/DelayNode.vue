<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Timer, Clock } from 'lucide-vue-next'

const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    config: Record<string, any>
  }
  selected?: boolean
}>()

const iconMap: Record<string, any> = {
  Timer,
  Clock,
}

const IconComponent = computed(() => iconMap[props.data.icon] || Timer)

const durationDisplay = computed(() => {
  if (!props.data.config?.duration) return null
  const unit = props.data.config.unit || 'seconds'
  return `${props.data.config.duration} ${unit}`
})
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 bg-background shadow-md min-w-[180px] transition-all"
    :class="selected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-orange-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3 !h-3 !bg-orange-500 !border-2 !border-background"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium text-orange-500 uppercase tracking-wider">Delay</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Delay config preview -->
    <div v-if="durationDisplay" class="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
      Wait: {{ durationDisplay }}
    </div>
    
    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3 !h-3 !bg-orange-500 !border-2 !border-background"
    />
  </div>
</template>
