<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { Component } from 'vue'
import LitiumSymbol from '~/assets/logos/litium-symbol.svg'
import MonitorSymbol from '~/assets/logos/monitor-symbol.svg'

const PROVIDER_LOGOS: Record<string, Component> = {
  litium: LitiumSymbol,
  monitor: MonitorSymbol,
}

const props = defineProps<{
  data: {
    label: string
    icon: string
    description: string
    actionName?: string
    config: Record<string, any>
  }
  selected?: boolean
}>()

const { resolveIcon } = useLucideIcon()

const providerKey = computed(() => {
  const name = props.data.actionName ?? ''
  const dotIndex = name.indexOf('.')
  return dotIndex > 0 ? name.substring(0, dotIndex) : name
})

const PROVIDER_ICON_DEFAULTS: Record<string, string> = {
  geins: 'Box',
  monitor: 'Activity',
  net: 'Globe',
  storage: 'Database',
  transform: 'ArrowRightLeft',
  common: 'Settings',
}

const manifestStore = useWorkflowManifest()
const { actionCategories: manifestActionCategories } = manifestStore

const providerLogo = computed(() => PROVIDER_LOGOS[providerKey.value] ?? null)
const IconComponent = computed(() => {
  const key = providerKey.value
  const cat = manifestActionCategories.value.find(c => c.name === key)
  if (cat?.icon) return resolveIcon(cat.icon)
  return resolveIcon(PROVIDER_ICON_DEFAULTS[key] ?? '') || resolveIcon('Zap')
})
</script>

<template>
  <div class="bg-background flex min-h-[100px] min-w-[180px] items-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-500/50'">
    <!-- Input handle -->
    <Handle type="target" :position="Position.Left" class="!border-background !h-3 !w-3 !border-2 !bg-blue-500" />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <component :is="providerLogo" v-if="providerLogo" class="h-5 w-5 dark:invert" />
        <component :is="IconComponent" v-else class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-blue-500 uppercase">Action</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Output handle -->
    <WorkflowHandlePlus handle-class="!border-background !h-3 !w-3 !border-2 !bg-blue-500" />
  </div>
</template>
