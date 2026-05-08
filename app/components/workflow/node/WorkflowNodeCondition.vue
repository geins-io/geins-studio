<script setup lang="ts">
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue'
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue'

type ConditionEntry = { label: string, condition?: string, description?: string }

const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    config: Record<string, unknown>
    conditions?: ConditionEntry[]
    defaultLabel?: string
  }
  selected?: boolean
}>()

const DEFAULT_BRANCHES = [
  { id: 'true', label: 'Yes', isDefault: false },
  { id: 'false', label: 'No', isDefault: true },
]

const branches = computed(() => {
  const conds = props.data.conditions
  if (!conds || conds.length === 0) return DEFAULT_BRANCHES

  const items = conds.map(c => ({
    id: c.label,
    label: c.label,
    isDefault: false,
  }))

  if (props.data.defaultLabel) {
    items.push({
      id: props.data.defaultLabel,
      label: props.data.defaultLabel,
      isDefault: true,
    })
  }

  return items
})

const handlePositions = computed(() => {
  const count = branches.value.length
  if (count === 1) return [50]
  return branches.value.map((_, i) => 25 + (i * 50) / (count - 1))
})
</script>

<template>
  <div
    class="bg-background flex min-h-[100px] min-w-[180px] flex-col justify-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-yellow-500 ring-[6px] ring-yellow-500/20' : 'border-yellow-500/50'"
  >
    <!-- Input handle -->
    <WorkflowHandleInput handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-yellow-500" />

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

    <!-- Dynamic output handles -->
    <WorkflowHandlePlus
      v-for="(branch, i) in branches"
      :key="branch.id"
      :handle-id="branch.id"
      :style="{ top: `${handlePositions[i]}%` }"
      :handle-class="`!border-background !h-3 !w-3 !border-2 ${branch.isDefault ? '!bg-muted-foreground' : '!bg-green-500'}`"
    />

    <!-- Dynamic handle labels -->
    <div
      v-for="(branch, i) in branches"
      :key="`label-${branch.id}`"
      class="bg-background/80 absolute -right-1 translate-x-full rounded px-1 text-[10px] font-medium"
      :class="branch.isDefault ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'"
      :style="{ top: `${(handlePositions[i] ?? 50) - 5}%` }"
    >
      {{ branch.label }}
    </div>
  </div>
</template>
