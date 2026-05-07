<script setup lang="ts">
import type { ManifestNodeTypeConfig } from '#shared/types'
import type { ManifestAction } from '@/composables/useWorkflowManifest'
import NodeSettingsAction from './settings/NodeSettingsAction.vue'
import NodeSettingsCondition from './settings/NodeSettingsCondition.vue'
import NodeSettingsDelay from './settings/NodeSettingsDelay.vue'
import NodeSettingsIterator from './settings/NodeSettingsIterator.vue'
import NodeSettingsPaginator from './settings/NodeSettingsPaginator.vue'
import NodeSettingsTrigger from './settings/NodeSettingsTrigger.vue'
import NodeSettingsWorkflow from './settings/NodeSettingsWorkflow.vue'
import type { Component } from 'vue'

const SETTINGS_COMPONENTS: Record<string, Component> = {
  trigger: NodeSettingsTrigger,
  action: NodeSettingsAction,
  condition: NodeSettingsCondition,
  iterator: NodeSettingsIterator,
  loop: NodeSettingsIterator,
  delay: NodeSettingsDelay,
  workflow: NodeSettingsWorkflow,
  paginator: NodeSettingsPaginator,
}

const props = defineProps<{
  nodeType: string
  nodeData: Record<string, unknown>
}>()

const manifestStore = useWorkflowManifest()

const manifestNodeType = computed(() => manifestStore.getNodeType(props.nodeType))
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (props.nodeType !== 'action') return undefined
  return manifestStore.getAction(props.nodeData.actionName as string | undefined)
})

const nodeTypeConfig = computed<ManifestNodeTypeConfig[]>(
  () => manifestNodeType.value?.config ?? [],
)

const nodeConfig = computed(() => (props.nodeData.config ?? {}) as Record<string, unknown>)
const nodeInput = computed(() => (props.nodeData.input ?? {}) as Record<string, unknown>)

const settingsComponent = computed(() => SETTINGS_COMPONENTS[props.nodeType])

const onNodeSettingsChange = inject<() => void>('onNodeSettingsChange', () => {})

const updateConfig = (name: string, value: unknown) => {
  if (!props.nodeData.config) props.nodeData.config = {}
  ;(props.nodeData.config as Record<string, unknown>)[name] = value
  onNodeSettingsChange()
}

const updateInput = (name: string, value: unknown) => {
  if (!props.nodeData.input) props.nodeData.input = {}
  ;(props.nodeData.input as Record<string, unknown>)[name] = value
  onNodeSettingsChange()
}

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const inputTypeToHtml = (type: string): string => {
  const lower = type.toLowerCase()
  if (lower === 'number' || lower === 'integer' || lower === 'int') return 'number'
  if (lower === 'boolean' || lower === 'bool') return 'checkbox'
  return 'text'
}

const isTextarea = (field: { editorHint?: string, type: string }): boolean =>
  field.editorHint === 'textarea'
  || field.editorHint === 'json'
  || field.editorHint === 'expression'
  || field.type.toLowerCase() === 'object'
  || field.type.toLowerCase() === 'json'

const activeTab = ref<'settings' | 'schema'>('settings')

const outputFields = computed(() => manifestAction.value?.output ?? [])

// ─── Drag expression drop handling ────────────────────────────────
const DRAG_MIME = 'application/x-workflow-expression'

const hasExpressionData = (dt: DataTransfer): boolean => {
  for (let i = 0; i < dt.types.length; i++) {
    if (dt.types[i] === DRAG_MIME) return true
  }
  return false
}

const resolveDropTarget = (el: EventTarget | null): HTMLInputElement | HTMLTextAreaElement | null => {
  if (!(el instanceof HTMLElement)) return null
  if (el.tagName === 'INPUT') return el as HTMLInputElement
  if (el.tagName === 'TEXTAREA') return el as HTMLTextAreaElement
  return el.closest('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
}

let lastHighlighted: HTMLElement | null = null

const onSettingsDragOver = (event: DragEvent) => {
  if (!event.dataTransfer || !hasExpressionData(event.dataTransfer)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  const target = resolveDropTarget(event.target)
  if (target && target !== lastHighlighted) {
    lastHighlighted?.classList.remove('ring-2', 'ring-primary/50')
    target.classList.add('ring-2', 'ring-primary/50')
    lastHighlighted = target
  }
}

const onSettingsDragLeave = (event: DragEvent) => {
  const related = event.relatedTarget as HTMLElement | null
  if (lastHighlighted && !lastHighlighted.contains(related)) {
    lastHighlighted.classList.remove('ring-2', 'ring-primary/50')
    lastHighlighted = null
  }
}

const onSettingsDrop = (event: DragEvent) => {
  lastHighlighted?.classList.remove('ring-2', 'ring-primary/50')
  lastHighlighted = null

  if (!event.dataTransfer) return
  const expr = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData('text/plain')
  if (!expr) return
  const target = resolveDropTarget(event.target)
  if (!target) return

  event.preventDefault()
  event.stopPropagation()

  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? start
  const before = target.value.slice(0, start)
  const after = target.value.slice(end)
  target.value = before + expr + after
  target.dispatchEvent(new Event('input', { bubbles: true }))
  target.dispatchEvent(new Event('change', { bubbles: true }))

  nextTick(() => {
    const pos = start + expr.length
    target.setSelectionRange(pos, pos)
    target.focus()
  })
}
</script>

<template>
  <div
    class="flex min-w-0 flex-1 flex-col"
    @dragover="onSettingsDragOver"
    @dragleave="onSettingsDragLeave"
    @drop="onSettingsDrop"
  >
    <div class="flex items-center border-b">
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="activeTab === 'settings'
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'settings'"
      >
        <LucideSettings2 class="h-3.5 w-3.5" />
        Settings
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="activeTab === 'schema'
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'schema'"
      >
        <LucideFileJson class="h-3.5 w-3.5" />
        Output Schema
      </button>
    </div>

    <!-- Settings tab -->
    <div v-show="activeTab === 'settings'" class="relative flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable;">
      <!-- Per-node-type settings component -->
      <component
        :is="settingsComponent"
        v-if="settingsComponent"
        :node-data="nodeData"
        :node-config="nodeConfig"
        :node-input="nodeInput"
        :manifest-action="manifestAction"
        :update-config="updateConfig"
        :update-input="updateInput"
      />

      <!-- Fallback: manifest config fields for unknown node types -->
      <template v-else-if="nodeTypeConfig.length">
        <div class="space-y-3">
          <div v-for="field in nodeTypeConfig" :key="field.name" class="space-y-1">
            <label class="text-muted-foreground flex items-center gap-1 text-sm">
              {{ prettyLabel(field.name) }}
              <span v-if="field.required" class="text-destructive">*</span>
            </label>
            <p v-if="field.description" class="text-muted-foreground text-xs">
              {{ field.description }}
            </p>
            <textarea
              v-if="isTextarea(field)"
              :value="typeof nodeConfig[field.name] === 'object' ? JSON.stringify(nodeConfig[field.name], null, 2) : String(nodeConfig[field.name] ?? field.defaultValue ?? '')"
              rows="3"
              :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
              class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
              @input="updateConfig(field.name, ($event.target as HTMLTextAreaElement).value)"
            />
            <div
              v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                :checked="Boolean(nodeConfig[field.name] ?? field.defaultValue)"
                class="rounded border"
                @change="updateConfig(field.name, ($event.target as HTMLInputElement).checked)"
              />
            </div>
            <input
              v-else
              :type="inputTypeToHtml(field.type)"
              :value="nodeConfig[field.name] ?? field.defaultValue ?? ''"
              :placeholder="String(field.defaultValue ?? '')"
              class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              @input="updateConfig(field.name, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Output Schema tab -->
    <div v-show="activeTab === 'schema'" class="flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable;">
      <template v-if="outputFields.length">
        <div class="space-y-2">
          <div
            v-for="field in outputFields"
            :key="field.name"
            class="bg-muted/50 flex items-start gap-3 rounded-md border px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ field.name }}</span>
                <span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-mono">{{ field.type }}</span>
              </div>
              <p v-if="field.description" class="text-muted-foreground mt-0.5 text-xs">{{ field.description }}</p>
            </div>
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
      >
        <LucideFileJson class="h-8 w-8 opacity-40" />
        <div>
          <p class="font-medium">No output schema</p>
          <p class="mt-0.5 opacity-70">This node type does not define an output schema</p>
        </div>
      </div>
    </div>
  </div>
</template>
