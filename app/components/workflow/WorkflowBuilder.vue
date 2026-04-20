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
import type { PaletteItem } from './palette-types'
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
const isAddNodeOpen = ref(false)
const showMinimap = ref(false)

// Selecting a node auto-opens the bottom properties panel; clicking the pane
// clears the selection and hides it.
const onNodeClick = (event: any) => {
  selectedNode.value = event.node
}

const onPaneClick = () => {
  selectedNode.value = null
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

// Drop handler: the palette sidebar sets the PaletteItem JSON on dataTransfer
// in its `dragstart` handler, which we read here to place the node at the
// drop position (projected into VueFlow's viewport coords).
const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow')
  if (!data) return
  const item = JSON.parse(data) as PaletteItem
  const position = project({ x: event.clientX - 100, y: event.clientY - 100 })
  addNodes([buildNewNode(item, position)])
  isAddNodeOpen.value = false
}

// Click-to-add from the palette: place at a default viewport position.
const handleAddFromPalette = (item: PaletteItem) => {
  const position = project({ x: 400, y: 300 })
  addNodes([buildNewNode(item, position)])
  isAddNodeOpen.value = false
}

const deleteSelectedNode = () => {
  if (selectedNode.value) {
    removeNodes([selectedNode.value.id])
    selectedNode.value = null
  }
}

const isRunning = ref(false)
const lastExecutionId = ref<string | null>(null)
const logsPanelRef = ref<{ open: () => void, close: () => void, toggle: () => void } | null>(null)

// Terminal execution statuses — when the current execution reaches any of
// these, `isRunning` flips back to false. Everything else (Running / Pending
// / Suspended / ContinuedAsNew) is treated as still in-flight.
const TERMINAL_STATUSES = new Set([
  'completed',
  'failed',
  'canceled',
  'cancelled',
  'timedout',
  'terminated',
])

// Poll the current execution's status while `isRunning` is true so the Run
// button keeps its running visual as long as the workflow is actually
// executing in the backend (not just while the start API call is in flight).
usePollWhile(
  isRunning,
  async () => {
    if (!lastExecutionId.value) return
    const res = await orchestratorApi.execution.get(lastExecutionId.value)
    const status = (res?.execution?.status ?? '').toLowerCase()
    if (TERMINAL_STATUSES.has(status)) {
      isRunning.value = false
      emit('executed')
    }
  },
  2000,
)

const runWorkflow = async () => {
  if (props.isNew) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be executed.',
    })
    return
  }
  try {
    const res = await orchestratorApi.execution.start(props.workflowId)
    const execId = res?.executionId ?? res?.newExecutionId ?? null
    lastExecutionId.value = execId
    // Only now mark as running — the polling composable will flip it back
    // to false once the execution reaches a terminal status.
    isRunning.value = true
    logsPanelRef.value?.open()
    toast({
      title: 'Execution started',
      description: execId ? `ID: ${execId}` : res?.message ?? 'Workflow is running.',
    })
    emit('executed')
  }
  catch (err) {
    isRunning.value = false
    geinsLogError('Failed to start execution', err)
    toast({
      title: 'Failed to start execution',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'negative',
    })
  }
}
</script>

<template>
  <div class="relative flex h-[calc(100vh-14rem)] flex-col">
    <!-- Row: canvas column (VueFlow + properties panel) + add-node sidebar -->
    <div class="relative flex min-h-0 flex-1">
      <!-- Canvas column -->
      <div class="relative flex min-w-0 flex-1 flex-col">
        <div class="relative flex-1 overflow-hidden" @dragover="onDragOver" @drop="onDrop">
          <VueFlow :nodes="initialNodes" :edges="initialEdges" :node-types="nodeTypes"
            :default-viewport="{ zoom: 1, x: 0, y: 0 }" :min-zoom="0.1" :max-zoom="2" :fit-view-on-init="!isNew"
            class="bg-muted/30" @node-click="onNodeClick" @pane-click="onPaneClick">
            <Background pattern-color="hsl(var(--border))" :gap="20" />
            <Controls position="bottom-left">
              <ControlButton :title="showMinimap ? 'Hide minimap' : 'Show minimap'" @click="showMinimap = !showMinimap">
                <LucideMap class="h-4 w-4" />
              </ControlButton>
            </Controls>
            <MiniMap v-if="showMinimap" position="bottom-right" :node-color="(node: any) => {
              if (node.type === 'trigger') return 'hsl(142 76% 36%)'
              if (node.type === 'condition') return 'hsl(48 96% 53%)'
              if (node.type === 'loop') return 'hsl(280 67% 60%)'
              if (node.type === 'delay') return 'hsl(25 95% 53%)'
              return 'hsl(217 91% 60%)'
            }" />
          </VueFlow>

          <div class="pointer-events-none absolute top-4 right-3 z-10 flex flex-col gap-2 @2xl:right-8">
            <button
              class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
              :title="isAddNodeOpen ? 'Close add node' : 'Add node'" @click="isAddNodeOpen = !isAddNodeOpen">
              <LucidePlus class="h-4 w-4" />
            </button>
            <button
              class="bg-background pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-red-500 shadow-sm hover:bg-red-800"
              :class="{ 'cursor-not-allowed opacity-50': isNew }"
              :disabled="isRunning || isNew"
              :title="isNew ? 'Save workflow to run' : isRunning ? 'Running…' : 'Run workflow'" @click="runWorkflow">
              <LucideLoader2 v-if="isRunning" class="h-4 w-4 animate-spin text-white" />
              <LucidePlay v-else class="h-4 w-4 text-white" />
            </button>
          </div>

          <WorkflowNodePropertiesSidebar :node="selectedNode" @close="selectedNode = null"
            @delete="deleteSelectedNode" />
        </div>
      </div>

      <WorkflowAddNodeSidebar v-model:open="isAddNodeOpen" @add="handleAddFromPalette" />
    </div>

    <LogsPanel ref="logsPanelRef" :execution-id="lastExecutionId" />
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
