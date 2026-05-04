<script setup lang="ts">
import type { ManifestAction } from '@/composables/useWorkflowManifest'
import NodePaneInput from './NodePaneInput.vue'
import NodePaneOutput from './NodePaneOutput.vue'
import NodePaneSettings from './NodePaneSettings.vue'

type NodeExecution = {
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
  status?: string
} | null

const props = defineProps<{
  node: Record<string, unknown> | null
  nodeExecution?: NodeExecution
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const isOpen = computed(() => props.node !== null)

const manifestStore = useWorkflowManifest()
const { resolveIcon } = useLucideIcon()

const nodeData = computed(() => (props.node?.data ?? {}) as Record<string, unknown>)
const nodeType = computed(() => (props.node?.type ?? '') as string)
const isTriggerNode = computed(() => nodeType.value === 'trigger')

const manifestNodeType = computed(() => manifestStore.getNodeType(nodeType.value))
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (nodeType.value !== 'action') return undefined
  return manifestStore.getAction(nodeData.value.actionName as string | undefined)
})

const nodeIcon = computed(() => {
  const iconName = (nodeData.value.icon as string | undefined)
    ?? manifestNodeType.value?.icon
    ?? manifestAction.value?.icon
  return resolveIcon(iconName)
})

const nodeLabel = computed(() => (nodeData.value.label as string) || manifestNodeType.value?.displayName || 'Node properties')

const isEditingLabel = ref(false)
const editLabelText = ref('')
const labelInput = ref<HTMLInputElement>()
const labelMeasure = ref<HTMLSpanElement>()

const labelWidth = computed(() => {
  const text = isEditingLabel.value ? editLabelText.value : nodeLabel.value
  return text || 'Node'
})

const startEditLabel = () => {
  editLabelText.value = nodeLabel.value
  isEditingLabel.value = true
  nextTick(() => {
    labelInput.value?.focus()
    labelInput.value?.select()
  })
}

const commitLabel = () => {
  const trimmed = editLabelText.value.trim()
  if (trimmed && trimmed !== nodeLabel.value) {
    nodeData.value.label = trimmed
  }
  isEditingLabel.value = false
}

const cancelEditLabel = () => {
  isEditingLabel.value = false
}
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'">
    <!-- Header — full width, icon + name left, actions right -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <component :is="nodeIcon" v-if="nodeIcon" class="h-4 w-4 shrink-0" />
        <LucideSettings v-else class="h-4 w-4 shrink-0" />
        <div class="group relative inline-grid min-w-0 items-center text-sm font-medium">
          <span ref="labelMeasure" class="invisible col-start-1 row-start-1 whitespace-pre px-1">{{ labelWidth }}</span>
          <input
            v-if="isEditingLabel"
            ref="labelInput"
            v-model="editLabelText"
            class="col-start-1 row-start-1 min-w-0 rounded bg-transparent px-1 text-sm font-medium outline-none ring-1 ring-primary"
            @blur="commitLabel"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            @keydown.escape.prevent="cancelEditLabel"
          />
          <span
            v-else
            class="col-start-1 row-start-1 cursor-text truncate rounded px-1 group-hover:ring-1 group-hover:ring-border"
            @click="startEditLabel"
          >{{ nodeLabel }}</span>
        </div>
        <span v-if="nodeExecution?.status" class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize" :class="{
          'bg-green-500/10 text-green-600 dark:text-green-400': nodeExecution.status === 'completed' || nodeExecution.status === 'succeeded',
          'bg-red-500/10 text-red-600 dark:text-red-400': nodeExecution.status === 'failed',
          'bg-blue-500/10 text-blue-600 dark:text-blue-400': nodeExecution.status === 'running',
          'bg-muted text-muted-foreground': !['completed', 'succeeded', 'failed', 'running'].includes(nodeExecution.status ?? ''),
        }">
          {{ nodeExecution.status }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button v-if="node && !isTriggerNode" class="hover:bg-destructive/10 text-destructive rounded p-1.5"
          title="Delete node" @click="emit('delete')">
          <LucideTrash2 class="h-4 w-4" />
        </button>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="emit('close')">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- 3-column body (trigger nodes show only center) -->
    <div v-if="node" class="flex min-h-0 flex-1">
      <NodePaneInput v-if="!isTriggerNode" :node-id="(node.id as string)" :node-execution="nodeExecution" />
      <NodePaneSettings :node-type="nodeType" :node-data="nodeData" />
      <NodePaneOutput v-if="!isTriggerNode" :node-execution="nodeExecution" />
    </div>
  </div>
</template>
