<script setup lang="ts">
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue'
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue'

const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    config: Record<string, unknown>
    input: Record<string, unknown>
  }
  selected?: boolean
}>()

const { resolveIcon } = useLucideIcon()

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('BookOpen'))

const pageDisplay = computed(() => {
  const input = props.data.input ?? {}
  const config = props.data.config ?? {}
  const size = input.pageSize || config.pageSize
  if (!size) return null
  const strategyRaw = input.strategy || config.strategy
  const strategy = typeof strategyRaw === 'string' ? strategyRaw : ''
  const max = input.maxPages || config.maxPages
  const parts: string[] = []
  if (strategy) parts.push(strategy)
  parts.push(`${size}/page`)
  if (max) parts.push(`max: ${max}`)
  return parts.join(' · ')
})
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-indigo-500 ring-[6px] ring-indigo-500/20' : 'border-indigo-500/50'"
  >
    <!-- Input handle -->
    <WorkflowHandleInput handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-indigo-500" />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-indigo-500 uppercase">Paginator</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Config preview -->
    <div v-if="pageDisplay" class="text-muted-foreground bg-muted/50 mt-2 truncate rounded px-2 py-1 font-mono text-xs">
      {{ pageDisplay }}
    </div>

    <!-- Fetch Page output handle -->
    <WorkflowHandlePlus
      handle-id="fetchPage"
      :style="{ top: '20%' }"
      :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-indigo-500"
    />

    <!-- For Each Page output handle -->
    <WorkflowHandlePlus
      handle-id="forEachPage"
      :style="{ top: '50%' }"
      :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-indigo-500"
    />

    <!-- Completed output handle -->
    <WorkflowHandlePlus
      handle-id="completed"
      :style="{ top: '80%' }"
      :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-gray-400"
    />

    <!-- Labels for handles -->
    <div
      class="bg-background/80 absolute top-[15%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-indigo-500"
    >
      Fetch Page
    </div>
    <div
      class="bg-background/80 absolute top-[45%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-indigo-500"
    >
      Each Page
    </div>
    <div
      class="bg-background/80 absolute top-[75%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-gray-400"
    >
      Completed
    </div>
  </div>
</template>
