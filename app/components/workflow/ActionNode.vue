<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Globe, Mail, MessageSquare, Database, FileText, Zap, Bell, Send, Download, Upload, Code, Filter, Merge, Split } from 'lucide-vue-next'

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
  Globe,
  Mail,
  MessageSquare,
  Database,
  FileText,
  Zap,
  Bell,
  Send,
  Download,
  Upload,
  Code,
  Filter,
  Merge,
  Split,
}

const IconComponent = computed(() => iconMap[props.data.icon] || Zap)
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 bg-background shadow-md min-w-[180px] transition-all"
    :class="selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-500/50'"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
    />

    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div class="text-xs font-medium text-blue-500 uppercase tracking-wider">Action</div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>
    
    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
    />
  </div>
</template>
