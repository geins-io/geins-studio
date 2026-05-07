<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import type { WorkflowInput, WorkflowVariable } from '#shared/types'
import { useToast } from '@/components/ui/toast/use-toast'
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'
import WorkflowDataType from '../shared/WorkflowDataType.vue'
import type { Ref } from 'vue'

type NodeExecution = {
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
  status?: string
} | null

const props = defineProps<{
  nodeId: string
  nodeExecution?: NodeExecution
}>()

const manifestStore = useWorkflowManifest()
const { toast } = useToast()
const { nodes: vfNodes, edges: vfEdges } = useVueFlow()

const workflowInputDefs = inject<Ref<WorkflowInput[]>>('workflowInputDefs', ref([]))
const workflowVariables = inject<Ref<WorkflowVariable[]>>('workflowVariables', ref([]))

type NodeExecData = { input?: Record<string, unknown> | null, output?: Record<string, unknown> | null, status?: string, error?: string | null }
const lastNodeExecutions = inject<Ref<Map<string, NodeExecData>>>('lastNodeExecutions')

const hasExecutionInput = computed(() => props.nodeExecution?.input != null)

const formatJson = (value: unknown): string => {
  if (value == null) return '{}'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

// ─── Accordion sections ───────────────────────────────────────────
const inputPaneSections = ref<Set<string>>(new Set(['incoming']))

const toggleSection = (key: string) => {
  if (inputPaneSections.value.has(key)) inputPaneSections.value.delete(key)
  else inputPaneSections.value.add(key)
}

// ─── Upstream nodes ───────────────────────────────────────────────
type UpstreamNode = {
  id: string
  label: string
  actionName?: string
  outputFields: Array<{ name: string, type: string }>
}

const upstreamNodes = computed(() => {
  if (!props.nodeId) return [] as UpstreamNode[]

  const sourceIds = vfEdges.value
    .filter(e => e.target === props.nodeId)
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

// ─── Search ───────────────────────────────────────────────────────
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

function runDataPreview(key: string): string | null {
  const input = props.nodeExecution?.input
  if (!input) return null
  const val = input[key]
  if (val === undefined) return null
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

function upstreamOutputPreview(nodeId: string, fieldName: string): string | null {
  const exec = lastNodeExecutions?.value?.get(nodeId)
  if (!exec?.output) return null
  const val = exec.output[fieldName]
  if (val === undefined) return null
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

function upstreamHasOutput(nodeId: string): boolean {
  const exec = lastNodeExecutions?.value?.get(nodeId)
  return exec?.status === 'Completed' && exec?.output != null
}

function truncatePreview(text: string, max = 200): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

const inferVarType = (v: { value: string, isSecret: boolean }): string => {
  if (v.isSecret) return 'secret'
  const val = v.value?.trim() ?? ''
  if (!val) return 'string'
  if (val === 'true' || val === 'false') return 'bool'
  if (/^-?\d+(\.\d+)?$/.test(val)) return 'number'
  if (val.startsWith('{') || val.startsWith('[')) return 'json'
  return 'string'
}

// ─── Drag expression from input pane → drop into settings fields ──
const DRAG_MIME = 'application/x-workflow-expression'

const onExpressionDragStart = (event: DragEvent, expr: string) => {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(DRAG_MIME, expr)
  event.dataTransfer.setData('text/plain', expr)
  event.dataTransfer.effectAllowed = 'copyMove'
}
</script>

<template>
  <div class="flex w-1/4 min-w-0 flex-col border-r">
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
                <LucideCircle v-if="!upstreamHasOutput(upstream.id)" class="h-2 w-2 fill-blue-500 text-blue-500" />
                <LucideCheckCircle2 v-else class="h-2.5 w-2.5 text-green-500" />
                {{ upstream.label }}
              </div>
              <div v-if="upstream.outputFields.length" class="space-y-0.5">
                <TooltipProvider v-for="field in upstream.outputFields" :key="field.name">
                  <Tooltip :disabled="!upstreamOutputPreview(upstream.id, field.name)">
                    <TooltipTrigger as-child>
                      <button
                        draggable="true"
                        class="hover:bg-muted flex w-full cursor-grab items-center justify-between rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                        :title="upstreamOutputPreview(upstream.id, field.name) ? undefined : `Drag or click to copy {{output.${upstream.id}.${field.name}}}`"
                        @click="copyExpression(`{{output.${upstream.id}.${field.name}}}`)"
                        @dragstart="onExpressionDragStart($event, `{{output.${upstream.id}.${field.name}}}`)"
                      >
                        <span class="font-mono text-[11px]">{{ field.name }}</span>
                        <div class="flex items-center gap-1">
                          <span v-if="upstreamOutputPreview(upstream.id, field.name)" class="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                          <WorkflowDataType :type="field.type" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" :side-offset="8" class="max-w-xs">
                      <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ truncatePreview(upstreamOutputPreview(upstream.id, field.name) ?? '') }}</pre>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div v-else class="text-muted-foreground px-1.5 py-1 text-[10px] italic">No output schema</div>
            </div>
          </div>
          <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
            {{ inputSearchLower ? 'No matches' : 'No connected nodes' }}
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
            <TooltipProvider v-for="inp in filteredInputDefs" :key="inp.name">
              <Tooltip :disabled="!runDataPreview(inp.name)">
                <TooltipTrigger as-child>
                  <button
                    draggable="true"
                    class="hover:bg-muted flex w-full cursor-grab items-center gap-1 rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                    :title="runDataPreview(inp.name) ? undefined : `${inp.type}${inp.description ? ' — ' + inp.description : ''}\n{{input.${inp.name}}}`"
                    @click="copyExpression(`{{input.${inp.name}}}`)"
                    @dragstart="onExpressionDragStart($event, `{{input.${inp.name}}}`)"
                  >
                    <WorkflowDataType :type="inp.type" />
                    <span class="min-w-0 truncate font-mono text-[11px]">{{ inp.name }}</span>
                    <span v-if="inp.required" class="text-destructive text-[9px]">*</span>
                    <span v-if="runDataPreview(inp.name)" class="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" :side-offset="8" class="max-w-xs">
                  <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ truncatePreview(runDataPreview(inp.name) ?? '') }}</pre>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
            {{ inputSearchLower ? 'No matches' : 'No inputs defined' }}
          </div>
        </div>
      </div>

      <!-- Variables -->
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
            <TooltipProvider v-for="v in filteredVariables" :key="v.key">
              <Tooltip :disabled="!runDataPreview(v.key)">
                <TooltipTrigger as-child>
                  <button
                    draggable="true"
                    class="hover:bg-muted flex w-full cursor-grab items-center gap-1 rounded px-1.5 py-1 text-left text-xs transition-colors active:cursor-grabbing"
                    :title="runDataPreview(v.key) ? undefined : (v.isSecret ? `{{vars.${v.key}}}` : `${v.value ?? ''}\n{{vars.${v.key}}}`)"
                    @click="copyExpression(`{{vars.${v.key}}}`)"
                    @dragstart="onExpressionDragStart($event, `{{vars.${v.key}}}`)"
                  >
                    <WorkflowDataType :type="inferVarType(v)" />
                    <span class="min-w-0 truncate font-mono text-[11px]">{{ v.key }}</span>
                    <span v-if="runDataPreview(v.key)" class="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" :side-offset="8" class="max-w-xs">
                  <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ truncatePreview(runDataPreview(v.key) ?? '') }}</pre>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div v-else class="text-muted-foreground py-2 text-center text-[10px]">
            {{ inputSearchLower ? 'No matches' : 'No variables defined' }}
          </div>
        </div>
      </div>

      <!-- Execution run data -->
      <div v-if="hasExecutionInput" class="p-3">
        <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">Run data</h4>
        <div class="min-h-40">
          <JsonCodeEditor
            :model-value="formatJson(nodeExecution?.input)"
            :readonly="true"
            :line-numbers="false"
            :line-wrapping="true"
            :expandable="true"
            expand-title="Input Run Data"
          />
        </div>
      </div>
    </div>
  </div>
</template>
