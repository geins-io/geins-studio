<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import type { ManifestNodeTypeConfig, WorkflowInput, WorkflowVariable } from '#shared/types'
import { useToast } from '@/components/ui/toast/use-toast'
import type { ManifestAction } from '@/composables/useWorkflowManifest'
import NodeSettingsAction from './settings/NodeSettingsAction.vue'
import NodeSettingsCondition from './settings/NodeSettingsCondition.vue'
import NodeSettingsDelay from './settings/NodeSettingsDelay.vue'
import NodeSettingsIterator from './settings/NodeSettingsIterator.vue'
import NodeSettingsPaginator from './settings/NodeSettingsPaginator.vue'
import NodeSettingsTrigger from './settings/NodeSettingsTrigger.vue'
import NodeSettingsWorkflow from './settings/NodeSettingsWorkflow.vue'
import type { Component, Ref } from 'vue'

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
const { toast } = useToast()

const nodeData = computed(() => (props.node?.data ?? {}) as Record<string, unknown>)
const nodeType = computed(() => (props.node?.type ?? '') as string)
const isTriggerNode = computed(() => nodeType.value === 'trigger')

const manifestNodeType = computed(() => manifestStore.getNodeType(nodeType.value))
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (nodeType.value !== 'action') return undefined
  return manifestStore.getAction(nodeData.value.actionName as string | undefined)
})

const nodeTypeConfig = computed<ManifestNodeTypeConfig[]>(
  () => manifestNodeType.value?.config ?? [],
)

const nodeConfig = computed(() => (nodeData.value.config ?? {}) as Record<string, unknown>)
const nodeInput = computed(() => (nodeData.value.input ?? {}) as Record<string, unknown>)

const nodeIcon = computed(() => {
  const iconName = (nodeData.value.icon as string | undefined)
    ?? manifestNodeType.value?.icon
    ?? manifestAction.value?.icon
  return resolveIcon(iconName)
})

const nodeLabel = computed(() => (nodeData.value.label as string) || manifestNodeType.value?.displayName || 'Node properties')

const settingsComponent = computed(() => SETTINGS_COMPONENTS[nodeType.value])

const updateConfig = (name: string, value: unknown) => {
  const config = nodeConfig.value
  config[name] = value
}

const updateInput = (name: string, value: unknown) => {
  const input = nodeInput.value
  input[name] = value
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

const formatJson = (value: unknown): string => {
  if (value == null) return '–'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

const hasExecutionInput = computed(() => props.nodeExecution?.input != null)
const hasExecutionOutput = computed(() => props.nodeExecution?.output != null)

// ─── Input pane: accordion data sources ───────────────────────────
const { nodes: vfNodes, edges: vfEdges } = useVueFlow()

const workflowInputDefs = inject<Ref<WorkflowInput[]>>('workflowInputDefs', ref([]))
const workflowVariables = inject<Ref<WorkflowVariable[]>>('workflowVariables', ref([]))

const inputPaneSections = ref<Set<string>>(new Set(['incoming']))

const toggleSection = (key: string) => {
  if (inputPaneSections.value.has(key)) inputPaneSections.value.delete(key)
  else inputPaneSections.value.add(key)
}

type UpstreamNode = {
  id: string
  label: string
  actionName?: string
  outputFields: Array<{ name: string, type: string }>
}

const upstreamNodes = computed(() => {
  const nodeId = props.node?.id as string | undefined
  if (!nodeId) return [] as UpstreamNode[]

  const sourceIds = vfEdges.value
    .filter(e => e.target === nodeId)
    .map(e => e.source)

  const result: UpstreamNode[] = []
  for (const srcId of sourceIds) {
    const n = vfNodes.value.find(nd => nd.id === srcId)
    if (!n) continue
    const data = (n.data ?? {}) as Record<string, unknown>
    const action = manifestStore.getAction(data.actionName as string | undefined)
    result.push({
      id: n.id,
      label: (data.label as string) || action?.displayName || n.id,
      actionName: data.actionName as string | undefined,
      outputFields: (action?.output ?? []) as Array<{ name: string, type: string }>,
    })
  }
  return result
})

const copyExpression = (expr: string) => {
  navigator.clipboard.writeText(expr)
  toast({ title: 'Copied', description: expr })
}

// ─── Input pane search ────────────────────────────────────────────
const inputSearch = ref('')
const inputSearchLower = computed(() => inputSearch.value.toLowerCase().trim())

const filteredUpstreamNodes = computed(() => {
  const q = inputSearchLower.value
  if (!q) return upstreamNodes.value
  return upstreamNodes.value
    .map(n => ({
      ...n,
      outputFields: n.outputFields.filter(f =>
        f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
      ),
    }))
    .filter(n => n.outputFields.length > 0 || n.label.toLowerCase().includes(q))
})

const filteredVariables = computed(() => {
  const q = inputSearchLower.value
  if (!q) return workflowVariables.value
  return workflowVariables.value.filter(v =>
    v.key.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q),
  )
})

const filteredInputDefs = computed(() => {
  const q = inputSearchLower.value
  if (!q) return workflowInputDefs.value
  return workflowInputDefs.value.filter(i =>
    i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q),
  )
})

watch(inputSearch, (v) => {
  if (!v.trim()) return
  inputPaneSections.value.add('incoming')
  inputPaneSections.value.add('variables')
  inputPaneSections.value.add('inputs')
})

const inferVarType = (v: { value: string, isSecret: boolean }): string => {
  if (v.isSecret) return 'secret'
  const val = v.value?.trim() ?? ''
  if (!val) return 'string'
  if (val === 'true' || val === 'false') return 'bool'
  if (/^-?\d+(\.\d+)?$/.test(val)) return 'number'
  if (val.startsWith('{') || val.startsWith('[')) return 'json'
  return 'string'
}

// Data-type badge rendering is handled by the shared <WorkflowDataType> component.

// ─── Drag expression from input pane → drop into settings fields ──
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

const onExpressionDragStart = (event: DragEvent, expr: string) => {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(DRAG_MIME, expr)
  event.dataTransfer.setData('text/plain', expr)
  event.dataTransfer.effectAllowed = 'copyMove'
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
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header — full width, icon + name left, actions right -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <component :is="nodeIcon" v-if="nodeIcon" class="h-4 w-4 shrink-0" />
        <LucideSettings v-else class="h-4 w-4 shrink-0" />
        <span class="truncate text-sm font-medium">{{ nodeLabel }}</span>
        <span
          v-if="nodeExecution?.status"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
          :class="{
            'bg-green-500/10 text-green-600 dark:text-green-400': nodeExecution.status === 'completed' || nodeExecution.status === 'succeeded',
            'bg-red-500/10 text-red-600 dark:text-red-400': nodeExecution.status === 'failed',
            'bg-blue-500/10 text-blue-600 dark:text-blue-400': nodeExecution.status === 'running',
            'bg-muted text-muted-foreground': !['completed', 'succeeded', 'failed', 'running'].includes(nodeExecution.status ?? ''),
          }"
        >
          {{ nodeExecution.status }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="node && !isTriggerNode"
          class="hover:bg-destructive/10 text-destructive rounded p-1.5"
          title="Delete node"
          @click="emit('delete')"
        >
          <LucideTrash2 class="h-4 w-4" />
        </button>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="emit('close')">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- 3-column body (trigger nodes show only center) -->
    <div v-if="node" class="flex min-h-0 flex-1">
      <!-- LEFT PANE: Input data (accordion) -->
      <div
        v-if="!isTriggerNode"
        class="flex w-1/4 min-w-0 flex-col border-r"
      >
        <div class="flex items-center gap-1.5 border-b px-3 py-2">
          <LucideArrowDownToLine class="text-muted-foreground h-3.5 w-3.5" />
          <span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Input</span>
          <span
            v-if="hasExecutionInput"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500"
          />
        </div>
        <div class="flex-1 overflow-y-auto" style="scrollbar-gutter: stable;">
          <!-- Search bar -->
          <div class="border-b px-3 py-2">
            <div class="relative">
              <LucideSearch class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
              <input
                v-model="inputSearch"
                type="text"
                placeholder="Search fields…"
                class="bg-muted focus:ring-ring w-full rounded-md py-1.5 pr-2 pl-7 text-xs focus:ring-2 focus:outline-none"
              />
              <button
                v-if="inputSearch"
                class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
                @click="inputSearch = ''"
              >
                <LucideX class="text-muted-foreground h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Incoming data from connected nodes -->
          <div class="border-b">
            <button
              class="flex w-full items-center gap-1.5 px-3 py-2 text-left"
              @click="toggleSection('incoming')"
            >
              <LucideChevronRight class="text-muted-foreground h-3 w-3 shrink-0 transition-transform" :class="{ 'rotate-90': inputPaneSections.has('incoming') }" />
              <span class="text-xs font-medium">Incoming data</span>
              <span v-if="filteredUpstreamNodes.length" class="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium">{{ filteredUpstreamNodes.length }}</span>
            </button>
            <div v-if="inputPaneSections.has('incoming')" class="px-3 pb-3">
              <div v-if="filteredUpstreamNodes.length" class="space-y-2">
                <div v-for="upstream in filteredUpstreamNodes" :key="upstream.id">
                  <div class="text-muted-foreground mb-1 flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
                    <LucideCircle class="h-2 w-2 fill-blue-500 text-blue-500" />
                    {{ upstream.label }}
                  </div>
                  <div v-if="upstream.outputFields.length" class="space-y-0.5">
                    <button
                      v-for="field in upstream.outputFields"
                      :key="field.name"
                      draggable="true"
                      class="hover:bg-muted flex w-full cursor-grab items-center justify-between rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                      :title="`Drag or click to copy {{output.${upstream.id}.${field.name}}}`"
                      @click="copyExpression(`{{output.${upstream.id}.${field.name}}}`)"
                      @dragstart="onExpressionDragStart($event, `{{output.${upstream.id}.${field.name}}}`)"
                    >
                      <span class="font-mono text-[11px]">{{ field.name }}</span>
                      <WorkflowDataType :type="field.type" />
                    </button>
                  </div>
                  <div v-else class="text-muted-foreground px-1.5 py-1 text-[10px] italic">No output schema</div>
                </div>
              </div>
              <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
                {{ inputSearchLower ? 'No matches' : 'No connected nodes' }}
              </div>
            </div>
          </div>

          <!-- Global variables -->
          <div class="border-b">
            <button
              class="flex w-full items-center gap-1.5 px-3 py-2 text-left"
              @click="toggleSection('variables')"
            >
              <LucideChevronRight class="text-muted-foreground h-3 w-3 shrink-0 transition-transform" :class="{ 'rotate-90': inputPaneSections.has('variables') }" />
              <span class="text-xs font-medium">Variables</span>
              <span v-if="filteredVariables.length" class="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium">{{ filteredVariables.length }}</span>
            </button>
            <div v-if="inputPaneSections.has('variables')" class="px-3 pb-3">
              <div v-if="filteredVariables.length" class="space-y-0.5">
                <button
                  v-for="v in filteredVariables"
                  :key="v.key"
                  draggable="true"
                  class="hover:bg-muted flex w-full cursor-grab items-center gap-1 rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                  :title="v.isSecret ? `{{vars.${v.key}}}` : `${v.value ?? ''}\n{{vars.${v.key}}}`"
                  @click="copyExpression(`{{vars.${v.key}}}`)"
                  @dragstart="onExpressionDragStart($event, `{{vars.${v.key}}}`)"
                >
                  <WorkflowDataType :type="inferVarType(v)" />
                  <span class="min-w-0 truncate font-mono text-[11px]">{{ v.key }}</span>
                </button>
              </div>
              <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
                {{ inputSearchLower ? 'No matches' : 'No variables defined' }}
              </div>
            </div>
          </div>

          <!-- Workflow inputs -->
          <div class="border-b">
            <button
              class="flex w-full items-center gap-1.5 px-3 py-2 text-left"
              @click="toggleSection('inputs')"
            >
              <LucideChevronRight class="text-muted-foreground h-3 w-3 shrink-0 transition-transform" :class="{ 'rotate-90': inputPaneSections.has('inputs') }" />
              <span class="text-xs font-medium">Workflow inputs</span>
              <span v-if="filteredInputDefs.length" class="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium">{{ filteredInputDefs.length }}</span>
            </button>
            <div v-if="inputPaneSections.has('inputs')" class="px-3 pb-3">
              <div v-if="filteredInputDefs.length" class="space-y-0.5">
                <button
                  v-for="inp in filteredInputDefs"
                  :key="inp.name"
                  draggable="true"
                  class="hover:bg-muted flex w-full cursor-grab items-center gap-1 rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                  :title="`${inp.type}${inp.description ? ' — ' + inp.description : ''}\n{{input.${inp.name}}}`"
                  @click="copyExpression(`{{input.${inp.name}}}`)"
                  @dragstart="onExpressionDragStart($event, `{{input.${inp.name}}}`)"
                >
                  <WorkflowDataType :type="inp.type" />
                  <span class="min-w-0 truncate font-mono text-[11px]">{{ inp.name }}</span>
                  <span v-if="inp.required" class="text-destructive text-[9px]">*</span>
                </button>
              </div>
              <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
                {{ inputSearchLower ? 'No matches' : 'No inputs defined' }}
              </div>
            </div>
          </div>

          <!-- Execution run data -->
          <div v-if="hasExecutionInput" class="p-3">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">Run data</h4>
            <pre class="bg-muted overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed">{{ formatJson(nodeExecution?.input) }}</pre>
          </div>
        </div>
      </div>

      <!-- CENTER PANE: Settings -->
      <div
        class="flex min-w-0 flex-1 flex-col"
        @dragover="onSettingsDragOver"
        @dragleave="onSettingsDragLeave"
        @drop="onSettingsDrop"
      >
        <div class="flex items-center gap-1.5 border-b px-3 py-2">
          <LucideSettings2 class="text-muted-foreground h-3.5 w-3.5" />
          <span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Settings</span>
        </div>

        <div class="flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable;">
          <!-- Node type badge -->
          <div class="mb-4 space-y-2">
            <label class="text-sm font-medium">Type</label>
            <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
              {{ manifestNodeType?.displayName ?? nodeType }}
            </div>
          </div>

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
      </div>

      <!-- RIGHT PANE: Output data -->
      <div
        v-if="!isTriggerNode"
        class="flex w-1/4 min-w-0 flex-col border-l"
      >
        <div class="flex items-center gap-1.5 border-b px-3 py-2">
          <LucideArrowUpFromLine class="text-muted-foreground h-3.5 w-3.5" />
          <span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Output</span>
          <span
            v-if="hasExecutionOutput"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-green-500"
          />
        </div>
        <div class="flex-1 overflow-y-auto p-3" style="scrollbar-gutter: stable;">
          <!-- Execution output data -->
          <template v-if="hasExecutionOutput">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">Run data</h4>
            <pre class="bg-muted overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed">{{ formatJson(nodeExecution?.output) }}</pre>
          </template>
          <div
            v-else
            class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
          >
            <LucideInbox class="h-8 w-8 opacity-40" />
            <div>
              <p class="font-medium">No output data</p>
              <p class="mt-0.5 opacity-70">Run the workflow to view output data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
