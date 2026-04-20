<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls, ControlButton } from '@vue-flow/controls'
import { VueFlow, useVueFlow, type NodeTypesObject } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import { useToast } from '@/components/ui/toast/use-toast'
import ActionNode from '~/components/workflow/ActionNode.vue'
import ConditionNode from '~/components/workflow/ConditionNode.vue'
import DelayNode from '~/components/workflow/DelayNode.vue'
import LogsPanel from '~/components/workflow/LogsPanel.vue'
import LoopNode from '~/components/workflow/LoopNode.vue'
import TriggerNode from '~/components/workflow/TriggerNode.vue'

const props = defineProps<{
  workflowId: string
  isNew: boolean
}>()

const emit = defineEmits<{
  executed: []
}>()

const { orchestratorApi } = useGeinsRepository()
const { geinsLogError } = useGeinsLog('workflow-builder')
const { toast } = useToast()

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  delay: DelayNode,
} as unknown as NodeTypesObject

const manifestStore = useWorkflowManifest()
const { actions: manifestActions, nodeTypes: manifestNodeTypes } = manifestStore

type PaletteItem = {
  nodeType: string
  id: string
  label: string
  description?: string
  actionName?: string
}

type PaletteSection = {
  category: string
  items: PaletteItem[]
}

// Structural flow-control nodes — triggers are workflow-level metadata, not nodes.
const STRUCTURAL_NODE_TYPES = new Set(['condition', 'iterator', 'delay', 'workflow'])

const paletteSections = computed<PaletteSection[]>(() => {
  const sections: PaletteSection[] = []

  const byCategory = new Map<string, PaletteItem[]>()
  for (const a of manifestActions.value) {
    const item: PaletteItem = {
      nodeType: 'action',
      id: a.name,
      label: a.displayName || a.name,
      description: a.description,
      actionName: a.name,
    }
    const list = byCategory.get(a.category)
    if (list) list.push(item)
    else byCategory.set(a.category, [item])
  }
  const sortedCategories = [...byCategory.keys()].sort()
  for (const category of sortedCategories) {
    sections.push({ category, items: byCategory.get(category)! })
  }

  const structural: PaletteItem[] = []
  for (const nt of manifestNodeTypes.value) {
    if (!STRUCTURAL_NODE_TYPES.has(nt.type)) continue
    structural.push({
      nodeType: nt.type,
      id: nt.type,
      label: nt.displayName || nt.type,
      description: nt.description,
    })
  }
  if (structural.length) sections.push({ category: 'Flow control', items: structural })

  return sections
})

const nodeSearchQuery = ref('')
const filteredNodeTemplates = computed<PaletteSection[]>(() => {
  const q = nodeSearchQuery.value.trim().toLowerCase()
  if (!q) return paletteSections.value
  return paletteSections.value
    .map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          item.label.toLowerCase().includes(q)
          || (item.description ?? '').toLowerCase().includes(q)
          || (item.actionName ?? '').toLowerCase().includes(q),
      ),
    }))
    .filter(section => section.items.length > 0)
})

const initialNodes = ref<any[]>([])
const initialEdges = ref<any[]>([])

onMounted(() => {
  if (props.isNew) {
    initialNodes.value = []
    return
  }
  // Demo data until the builder reads real node/connection data from the workflow.
  initialNodes.value = [
    {
      id: '1',
      type: 'trigger',
      position: { x: 100, y: 200 },
      data: {
        label: 'Webhook',
        icon: 'Webhook',
        description: 'Trigger on HTTP request',
        config: { method: 'POST', path: '/webhook' },
      },
    },
    {
      id: '2',
      type: 'action',
      position: { x: 400, y: 150 },
      data: {
        label: 'Transform Data',
        icon: 'FileText',
        description: 'Transform incoming data',
        config: {},
      },
    },
    {
      id: '3',
      type: 'condition',
      position: { x: 700, y: 200 },
      data: {
        label: 'Check Status',
        icon: 'GitBranch',
        description: 'Branch on status',
        config: { field: 'status', operator: 'equals', value: 'active' },
      },
    },
    {
      id: '4',
      type: 'action',
      position: { x: 1000, y: 100 },
      data: {
        label: 'Send Email',
        icon: 'Mail',
        description: 'Notify user',
        config: { to: '', subject: '', body: '' },
      },
    },
    {
      id: '5',
      type: 'action',
      position: { x: 1000, y: 300 },
      data: {
        label: 'Log Error',
        icon: 'Database',
        description: 'Log to database',
        config: {},
      },
    },
  ]

  initialEdges.value = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true', label: 'Yes' },
    { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false', label: 'No' },
  ]
})

const { onConnect, addEdges, addNodes, removeNodes, project } = useVueFlow()

onConnect((params) => {
  addEdges([{ ...params, animated: false }])
})

const selectedNode = ref<any>(null)
const isSidebarOpen = ref(false)
const showMinimap = ref(false)
const activeTab = ref<'properties' | 'add-node'>('properties')

const onNodeClick = (event: any) => {
  selectedNode.value = event.node
  activeTab.value = 'properties'
  isSidebarOpen.value = true
}

const onPaneClick = () => {
  selectedNode.value = null
}

const onDragStart = (event: DragEvent, item: PaletteItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const buildNewNode = (item: PaletteItem, position: { x: number, y: number }) => ({
  id: `${item.id}-${Date.now()}`,
  type: item.nodeType,
  position,
  data: {
    label: item.label,
    description: item.description,
    actionName: item.actionName,
    subtype: item.nodeType === 'action' ? undefined : item.id,
    config: {},
  },
})

const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow')
  if (!data) return
  const item = JSON.parse(data) as PaletteItem
  const position = project({ x: event.clientX - 100, y: event.clientY - 100 })
  addNodes([buildNewNode(item, position)])
  isSidebarOpen.value = false
}

const quickAddNode = (item: PaletteItem) => {
  const position = project({ x: 400, y: 300 })
  addNodes([buildNewNode(item, position)])
  isSidebarOpen.value = false
}

const deleteSelectedNode = () => {
  if (selectedNode.value) {
    removeNodes([selectedNode.value.id])
    selectedNode.value = null
  }
}

const openAddNodeTab = () => {
  isSidebarOpen.value = true
  activeTab.value = 'add-node'
}

const isRunning = ref(false)
const lastExecutionId = ref<string | null>(null)
const logsPanelRef = ref<{ open: () => void, close: () => void, toggle: () => void } | null>(null)

const runWorkflow = async () => {
  if (props.isNew) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be executed.',
    })
    return
  }
  isRunning.value = true
  try {
    const res = await orchestratorApi.execution.start(props.workflowId)
    const execId = res?.executionId ?? res?.newExecutionId ?? null
    lastExecutionId.value = execId
    logsPanelRef.value?.open()
    toast({
      title: 'Execution started',
      description: execId ? `ID: ${execId}` : res?.message ?? 'Workflow is running.',
    })
    emit('executed')
  }
  catch (err) {
    geinsLogError('Failed to start execution', err)
    toast({
      title: 'Failed to start execution',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'negative',
    })
  }
  finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="relative flex h-[calc(100vh-14rem)] flex-col">
    <div class="relative flex-1" @dragover="onDragOver" @drop="onDrop">
      <VueFlow
:nodes="initialNodes" :edges="initialEdges" :node-types="nodeTypes"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }" :min-zoom="0.1" :max-zoom="2" :fit-view-on-init="!isNew"
        class="bg-muted/30" @node-click="onNodeClick" @pane-click="onPaneClick">
        <Background pattern-color="hsl(var(--border))" :gap="20" />
        <Controls position="bottom-left">
          <ControlButton :title="showMinimap ? 'Hide minimap' : 'Show minimap'" @click="showMinimap = !showMinimap">
            <LucideMap class="h-4 w-4" />
          </ControlButton>
        </Controls>
        <MiniMap
v-if="showMinimap" position="bottom-right" :node-color="(node: any) => {
          if (node.type === 'trigger') return 'hsl(142 76% 36%)'
          if (node.type === 'condition') return 'hsl(48 96% 53%)'
          if (node.type === 'loop') return 'hsl(280 67% 60%)'
          if (node.type === 'delay') return 'hsl(25 95% 53%)'
          return 'hsl(217 91% 60%)'
        }" />
      </VueFlow>

      <div
        class="pointer-events-none absolute top-4 z-10 flex flex-col gap-2 transition-[right] duration-200 ease-in-out"
        :class="isSidebarOpen ? 'right-[21rem] @2xl:right-[21.5rem]' : 'right-3 @2xl:right-8'">
        <button
          class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
          :title="isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'" @click="isSidebarOpen = !isSidebarOpen">
          <LucidePanelRightClose v-if="isSidebarOpen" class="h-4 w-4" />
          <LucidePanelRightOpen v-else class="h-4 w-4" />
        </button>
        <button
          class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
          title="Add node" @click="openAddNodeTab">
          <LucidePlus class="h-4 w-4" />
        </button>
        <button
          class="bg-background pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-red-500 shadow-sm hover:bg-red-800 disabled:opacity-50"
          :disabled="isRunning || isNew"
          :title="isNew ? 'Save workflow to run' : isRunning ? 'Running…' : 'Run workflow'" @click="runWorkflow">
          <LucidePlay class="h-4 w-4 text-white" :class="{ 'animate-pulse': isRunning }" />
        </button>
      </div>
    </div>

    <LogsPanel ref="logsPanelRef" :execution-id="lastExecutionId" />

    <div
class="bg-background absolute inset-y-0 right-0 overflow-hidden border-l transition-[width] duration-200 ease-in-out"
      :class="isSidebarOpen ? 'w-80' : 'w-0 border-l-0'">
      <div class="h-full w-80 overflow-y-auto" style="scrollbar-gutter: stable;">
        <div v-if="activeTab === 'properties'" class="flex items-center gap-2 border-b px-4 py-3">
          <LucideSettings class="h-4 w-4" />
          <span class="text-sm font-medium">Node properties</span>
        </div>

        <div v-if="activeTab === 'properties'" class="p-4">
          <div v-if="selectedNode" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Node Settings</h3>
              <button
class="hover:bg-destructive/10 text-destructive rounded p-1.5" title="Delete node"
                @click="deleteSelectedNode">
                <LucideTrash2 class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Name</label>
              <input
v-model="selectedNode.data.label" type="text"
                class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Description</label>
              <textarea
v-model="selectedNode.data.description" rows="2"
                class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Type</label>
              <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
                {{ selectedNode.type }}
              </div>
            </div>

            <template v-if="selectedNode.type === 'trigger'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Trigger Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Webhook Path</label>
                    <input
v-model="selectedNode.data.config.path" type="text" placeholder="/webhook"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">HTTP Method</label>
                    <select
v-model="selectedNode.data.config.method"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>
              </div>
            </template>

            <template v-if="selectedNode.type === 'condition'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Condition Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Field</label>
                    <input
v-model="selectedNode.data.config.field" type="text" placeholder="data.status"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Operator</label>
                    <select
v-model="selectedNode.data.config.operator"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="is_empty">Is Empty</option>
                      <option value="is_not_empty">Is Not Empty</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Value</label>
                    <input
v-model="selectedNode.data.config.value" type="text" placeholder="active"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                </div>
              </div>
            </template>

            <template v-if="selectedNode.type === 'loop'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Loop Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Items Field</label>
                    <input
v-model="selectedNode.data.config.itemsField" type="text" placeholder="data.items"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Batch Size</label>
                    <input
v-model="selectedNode.data.config.batchSize" type="number" placeholder="1"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                </div>
              </div>
            </template>

            <template v-if="selectedNode.type === 'delay'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Delay Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Duration</label>
                    <div class="flex gap-2">
                      <input
v-model="selectedNode.data.config.duration" type="number" placeholder="5"
                        class="bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                      <select
v-model="selectedNode.data.config.unit"
                        class="bg-background focus:ring-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-if="selectedNode.type === 'action' && selectedNode.data.icon === 'Mail'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Email Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">To</label>
                    <input
v-model="selectedNode.data.config.to" type="email" placeholder="user@example.com"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Subject</label>
                    <input
v-model="selectedNode.data.config.subject" type="text" placeholder="Email subject"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Body</label>
                    <textarea
v-model="selectedNode.data.config.body" rows="4" placeholder="Email body..."
                      class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                </div>
              </div>
            </template>

            <template v-if="selectedNode.type === 'action' && selectedNode.data.icon === 'Globe'">
              <div class="border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">HTTP Request Settings</h4>
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">URL</label>
                    <input
v-model="selectedNode.data.config.url" type="url"
                      placeholder="https://api.example.com/endpoint"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Method</label>
                    <select
v-model="selectedNode.data.config.method"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Headers (JSON)</label>
                    <textarea
v-model="selectedNode.data.config.headers" rows="2"
                      placeholder='{"Authorization": "Bearer ..."}'
                      class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-sm">Body (JSON)</label>
                    <textarea
v-model="selectedNode.data.config.body" rows="4" placeholder='{"key": "value"}'
                      class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none" />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-else class="flex h-40 flex-col items-center justify-center text-center">
            <div class="text-muted-foreground text-sm">
              Click on a node to view and edit its properties
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'add-node'" class="p-4">
          <div class="relative mb-3">
            <LucideSearch class="text-muted-foreground pointer-events-none absolute top-2.5 left-2 h-4 w-4" />
            <input
v-model="nodeSearchQuery" type="text" placeholder="Search actions…"
              class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none" />
          </div>
          <div
v-if="manifestStore.loading.value && paletteSections.length === 0"
            class="text-muted-foreground py-8 text-center text-sm">
            Loading node types…
          </div>
          <div v-else class="space-y-4">
            <div v-for="section in filteredNodeTemplates" :key="section.category">
              <div class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {{ section.category }}
              </div>
              <div class="space-y-1.5">
                <button
v-for="item in section.items" :key="item.id"
                  class="hover:bg-muted/50 flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors"
                  draggable="true" @dragstart="(e) => onDragStart(e, item)" @click="quickAddNode(item)">
                  <LucidePlay class="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">{{ item.label }}</div>
                    <div v-if="item.actionName" class="text-muted-foreground font-mono text-[10px]">
                      {{ item.actionName }}
                    </div>
                    <div v-if="item.description" class="text-muted-foreground line-clamp-2 text-xs">
                      {{ item.description }}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div
v-if="filteredNodeTemplates.length === 0 && !manifestStore.loading.value"
              class="text-muted-foreground py-8 text-center text-sm">
              No nodes match your search
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.dark .vue-flow__edge-path {
  stroke: hsl(240 3.7% 45%);
}

.dark .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: hsl(217 91% 60%);
}

.dark .vue-flow__controls {
  background: hsl(240 10% 3.9%);
  border-color: hsl(240 3.7% 15.9%);
}

.dark .vue-flow__controls-button {
  background: hsl(240 10% 3.9%);
  border-color: hsl(240 3.7% 15.9%);
  color: hsl(0 0% 98%);
}

.dark .vue-flow__controls-button:hover {
  background: hsl(240 3.7% 15.9%);
}

.dark .vue-flow__minimap {
  background: hsl(240 10% 3.9%);
}

.vue-flow__edge-text {
  font-size: 10px;
}

/* Inset the bottom-left Controls panel so the buttons don't sit flush
   against the canvas edge. */
.vue-flow__panel.left {
  margin-left: 1rem;
}
</style>
