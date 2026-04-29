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

const IconComponent = computed(() => resolveIcon(props.data.icon) || resolveIcon('Repeat'))

const iterateDisplay = computed(() => {
  const field = props.data.config?.itemsField || props.data.config?.collection
  if (!field) return null
  const batch = props.data.config?.batchSize
  return batch ? `${field} (batch: ${batch})` : field
})
</script>

<template>
  <div
    class="bg-background flex min-h-[100px] min-w-[180px] items-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-purple-500 ring-[6px] ring-purple-500/20' : 'border-purple-500/50'">
    <!-- Input handle -->
    <WorkflowHandleInput handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-purple-500" />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-purple-500 uppercase">Iterator</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Iterator config preview -->
    <div v-if="iterateDisplay" class="text-muted-foreground bg-muted/50 mt-2 rounded px-2 py-1 text-xs">
      Iterate: {{ iterateDisplay }}
    </div>

    <!-- Loop body output handle -->
    <WorkflowHandlePlus handle-id="loop" :style="{ top: '30%' }" :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-purple-500" />

    <!-- Done output handle -->
    <WorkflowHandlePlus handle-id="done" :style="{ top: '70%' }" :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-gray-400" />

    <!-- Labels for handles -->
    <div
      class="bg-background/80 absolute top-[25%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-purple-500">
      Each
    </div>
    <div
      class="bg-background/80 absolute top-[65%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-gray-400">
      Done
    </div>
  </div>
</template>
