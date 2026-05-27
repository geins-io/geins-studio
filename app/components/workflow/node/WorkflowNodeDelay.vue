<script setup lang="ts">
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue'
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue'
const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    config: Record<string, any>
    input: Record<string, any>
  }
  selected?: boolean
}>()

const { resolveIcon } = useLucideIcon()

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('Timer'))

const UNIT_LABELS: Record<string, [string, string]> = {
  S: ['second', 'seconds'],
  M: ['minute', 'minutes'],
  H: ['hour', 'hours'],
}

const summary = computed(() => {
  const input = props.data.input ?? {}

  if (input.waitUntil) {
    const val = String(input.waitUntil)
    if (val.includes('{{')) return val
    return val.length > 24 ? val.slice(0, 24) + '…' : val
  }

  const iso = input.duration ?? props.data.config?.duration
  if (!iso) return null
  const match = String(iso).match(/^PT?(\d+)(S|M|H)$/i)
  if (match && match[1] && match[2]) {
    const amount = Number(match[1])
    const [singular, plural] = UNIT_LABELS[match[2].toUpperCase()] ?? ['unit', 'units']
    return `${amount} ${amount === 1 ? singular : plural}`
  }
  return String(iso)
})

const summaryIcon = computed(() => {
  const input = props.data.input ?? {}
  return input.waitUntil ? 'calendar-clock' : 'timer'
})

const SummaryIcon = computed(() => resolveIcon(summaryIcon.value))
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-orange-500 ring-[6px] ring-orange-500/20' : 'border-orange-500/50'"
  >
    <!-- Input handle -->
    <WorkflowHandleInput handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-orange-500" />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-orange-500 uppercase">Delay</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Delay config summary -->
    <div v-if="summary" class="text-muted-foreground bg-muted/50 mt-2 flex items-center gap-1.5 truncate rounded px-2 py-1 text-xs">
      <component :is="SummaryIcon" v-if="SummaryIcon" class="h-3 w-3 shrink-0" />
      {{ summary }}
    </div>
    
    <!-- Output handle -->
    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-orange-500"
    />
  </div>
</template>
