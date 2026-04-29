<script setup lang="ts">
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

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('Timer'))

const durationDisplay = computed(() => {
  if (!props.data.config?.duration) return null
  const unit = props.data.config.unit || 'seconds'
  return `${props.data.config.duration} ${unit}`
})
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-orange-500/50'"
  >
    <!-- Input handle -->
    <WorkflowHandleInput :style="{ top: '25%' }" handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-orange-500" />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-orange-500 uppercase">Delay</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Delay config preview -->
    <div v-if="durationDisplay" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      Wait: {{ durationDisplay }}
    </div>
    
    <!-- Output handle -->
    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-orange-500"
    />
  </div>
</template>
