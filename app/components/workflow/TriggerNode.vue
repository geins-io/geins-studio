<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Zap, Webhook, Clock } from 'lucide-vue-next'

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
  Webhook,
  Clock,
  Zap,
}

const IconComponent = computed(() => iconMap[props.data.icon] || Zap)
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="selected ? 'border-green-500 ring-2 ring-green-500/20' : 'border-green-500/50'"
  >
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-green-500 uppercase">Trigger</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>
    
    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!border-background !h-3 !w-3 !border-2 !bg-green-500"
    />
  </div>
</template>
