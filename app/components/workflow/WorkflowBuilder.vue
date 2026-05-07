<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls, ControlButton } from '@vue-flow/controls'
import { VueFlow, useVueFlow, type NodeTypesObject, type EdgeTypesObject } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { PaletteItem, WorkflowInput } from '#shared/types'
import { useToast } from '@/components/ui/toast/use-toast'
import KeyboardShortcutTooltip from './shared/KeyboardShortcutTooltip.vue'
import WorkflowPanelLogs from './panel/WorkflowPanelLogs.vue'
import WorkflowSidebarAddNode from './sidebar/WorkflowSidebarAddNode.vue'
import WorkflowSidebarNodeProperties from './sidebar/WorkflowSidebarNodeProperties.vue'
import WorkflowEdge from './edge/WorkflowEdge.vue'
import WorkflowNode from './node/WorkflowNode.vue'


const props = defineProps<{
  workflowId: string
  isNew: boolean
  isDirty?: boolean
}>()

const emit = defineEmits<{
  executed: []
  change: []
  'change:ui': []
  'save-and-run': []
}>()

const { orchestratorApi } = useGeinsRepository()
const { geinsLogInfo, geinsLogError } = useGeinsLog('workflow-builder')
const { toast } = useToast()
const { toCanvas, toApi } = useWorkflowCanvas()

// All node types are routed through the same dispatcher so the canvas host
// doesn't need to know about individual node implementations. WorkflowNode
// reads the `type` prop VueFlow forwards and renders the matching component.
const nodeTypes = {
  trigger: WorkflowNode,
  action: WorkflowNode,
  condition: WorkflowNode,
  iterator: WorkflowNode,
  loop: WorkflowNode,
  delay: WorkflowNode,
  workflow: WorkflowNode,
  paginator: WorkflowNode,
} as unknown as NodeTypesObject

const edgeTypes = {
  default: markRaw(WorkflowEdge),
} as unknown as EdgeTypesObject

const TRIGGER_NODE_ID = 'TRIGGER'

// Older workflows persisted the trigger's id in lowercase. We treat any
// case variant of "trigger" as the same logical node so edges saved before
// the constant was uppercased still resolve to the canvas trigger.
const isLegacyTriggerRef = (id: string | undefined): boolean =>
  typeof id === 'string' && id.toLowerCase() === 'trigger' && id !== TRIGGER_NODE_ID

// Shares the cache key with the parent page (pages/orchestrator/workflows/[id].vue),
// so Nuxt returns the already-fetched workflow instead of re-requesting.
const { data: currentWorkflow } = useAsyncData(
  () => `workflow-${props.workflowId}`,
  () => (props.isNew ? Promise.resolve(null) : orchestratorApi.workflow.get(props.workflowId)),
  { watch: [() => props.workflowId] },
)

// The trigger is workflow-level metadata — derive the node's display data
// from the workflow object so the canvas reflects the configured trigger
// type (Schedule / Event / Manual) without needing the user to edit a node.
type WorkflowTriggerShape = {
  type?: string
  cronExpression?: string
  eventEntity?: string
  eventAction?: string
  eventName?: string
  triggerDescription?: string
}
const triggerNodeData = computed(() => {
  const wf = currentWorkflow.value as WorkflowTriggerShape | null
  return {
    triggerType: wf?.type ?? 'onDemand',
    cronExpression: wf?.cronExpression ?? '',
    eventEntity: wf?.eventEntity ?? '',
    eventAction: wf?.eventAction ?? '',
    eventName: wf?.eventName ?? '',
    description: wf?.triggerDescription ?? '',
  }
})

// Stored canvas metadata on the workflow — position of the trigger node and
// the last viewport (zoom + pan). Persisted under the workflow's top-level
// `ui` field since the trigger node itself isn't part of `workflow.nodes[]`.
type WorkflowCanvasUi = {
  triggerPosition?: { x: number, y: number }
  viewport?: { x: number, y: number, zoom: number }
  [key: string]: unknown
}
const savedCanvasUi = computed<WorkflowCanvasUi>(() =>
  ((currentWorkflow.value as { ui?: WorkflowCanvasUi } | null)?.ui ?? {}),
)

const buildTriggerNode = () => ({
  id: TRIGGER_NODE_ID,
  type: 'trigger',
  position: savedCanvasUi.value.triggerPosition ?? { x: 100, y: 200 },
  data: { ...triggerNodeData.value },
  deletable: false,
})

const initialNodes = ref<any[]>([])
const initialEdges = ref<any[]>([])

onMounted(() => {
  if (props.isNew) {
    initialNodes.value = [buildTriggerNode()]
    return
  }
  const { nodes: canvasNodes, edges: canvasEdges } = toCanvas(currentWorkflow.value as any)
  // If the API payload omits a trigger node, prepend our derived one so the
  // canvas always has a trigger to anchor downstream nodes to.
  const existingTrigger = canvasNodes.find(n => n.type === 'trigger')
  // Migrate any legacy lowercase trigger id on the existing node so it lines
  // up with the new TRIGGER_NODE_ID and the edge migration below.
  if (existingTrigger && isLegacyTriggerRef(existingTrigger.id)) {
    existingTrigger.id = TRIGGER_NODE_ID
  }
  const triggerId = existingTrigger?.id ?? TRIGGER_NODE_ID
  const finalNodes = existingTrigger ? canvasNodes : [buildTriggerNode(), ...canvasNodes]

  // Remap legacy trigger references on edges before any further checks so a
  // workflow saved with `sourceNodeId: "trigger"` still connects to the new
  // canvas trigger node (id `TRIGGER`).
  const finalEdges = canvasEdges.map(e => ({
    ...e,
    source: isLegacyTriggerRef(e.source) ? TRIGGER_NODE_ID : e.source,
    target: isLegacyTriggerRef(e.target) ? TRIGGER_NODE_ID : e.target,
  }))

  // If we injected the trigger and there's at least one action node but no
  // edge from the trigger, auto-connect trigger → first action node.
  if (!existingTrigger && canvasNodes.length > 0) {
    const hasTriggerEdge = finalEdges.some(e => e.source === triggerId)
    if (!hasTriggerEdge) {
      const firstNode = canvasNodes[0]
      finalEdges.push({
        id: `${triggerId}-${firstNode.id}`,
        source: triggerId,
        target: firstNode.id,
        animated: false,
      })
    }
  }

  initialNodes.value = finalNodes
  initialEdges.value = finalEdges
})

const { onConnect, onPaneReady, addEdges, removeEdges, addNodes, removeNodes, project, findNode, nodes, edges, setNodes, fitView, zoomIn, zoomOut, getViewport, setViewport, addSelectedNodes, removeSelectedNodes } = useVueFlow()

const maxZoom = ref(1.5)
onPaneReady(() => {
  const savedVp = savedCanvasUi.value.viewport
  if (savedVp) {
    setViewport(savedVp)
  }
  else if (!props.isNew) {
    fitView({ padding: 0.4, maxZoom: 0.85 })
  }
  nextTick(() => { canvasReady.value = true })
})

// After init, VueFlow owns the node store — mutate the trigger node's data
// in place so reactivity picks up workflow changes (e.g. after a save).
watch(
  triggerNodeData,
  (d) => {
    const node = findNode(TRIGGER_NODE_ID)
    if (node) Object.assign(node.data, d)
  },
  { deep: true },
)

onConnect((params) => {
  addEdges([{ ...params, animated: false }])
})

// `canvasReady` flips to true after VueFlow has settled its initial layout
// (fit-view + handle measurement + any post-init node/edge reconciliation).
// Earlier we used onMounted+nextTick, but VueFlow keeps mutating nodes after
// that — so the deep watcher below was emitting `change` for work the user
// never did, flagging the workflow dirty the moment the Builder tab opened.
// onPaneReady fires once the viewport has stabilized, which is the real "ok
// to listen for user edits now" signal.
const canvasReady = ref(false)

const executionSnapshot = computed(() => {
  const n = nodes.value.map(node => ({
    id: node.id,
    type: node.type,
    data: node.data,
  }))
  const e = edges.value.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    data: edge.data,
  }))
  return JSON.stringify({ n, e })
})

const uiSnapshot = computed(() => {
  const positions = nodes.value.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
  }))
  return JSON.stringify(positions)
})

watch(executionSnapshot, () => {
  if (canvasReady.value) emit('change')
})

watch(uiSnapshot, () => {
  if (canvasReady.value) emit('change:ui')
})

const onNodeSettingsChange = () => {
  if (canvasReady.value) emit('change')
}
provide('onNodeSettingsChange', onNodeSettingsChange)

const selectedNode = ref<any>(null)
const isAddNodeOpen = ref(false)
const showMinimap = ref(false)

const pendingConnection = ref<{ sourceId: string, sourceHandle?: string } | null>(null)

const onHandlePlusClick = (sourceNodeId: string, sourceHandleId?: string) => {
  pendingConnection.value = { sourceId: sourceNodeId, sourceHandle: sourceHandleId }
  isAddNodeOpen.value = true
}
provide('onHandlePlusClick', onHandlePlusClick)

const pendingEdgeInsert = ref<{ sourceId: string, sourceHandle?: string | null, targetId: string } | null>(null)

const onEdgeAddNode = (edgeId: string, sourceNodeId: string, targetNodeId: string, sourceHandle?: string | null) => {
  pendingEdgeInsert.value = { sourceId: sourceNodeId, sourceHandle, targetId: targetNodeId }
  pendingConnection.value = { sourceId: sourceNodeId, sourceHandle: sourceHandle ?? undefined }
  isAddNodeOpen.value = true
}
provide('onEdgeAddNode', onEdgeAddNode)

const onEdgeDelete = (edgeId: string) => {
  const edge = edges.value.find(e => e.id === edgeId)
  if (edge) {
    removeEdges([edge])
  }
}
provide('onEdgeDelete', onEdgeDelete)

const onNodeDelete = (nodeId: string) => {
  if (nodeId === TRIGGER_NODE_ID) {
    toast({
      title: 'Trigger cannot be deleted',
      description: 'Change the trigger type in the General tab.',
    })
    return
  }
  removeNodes([nodeId])
  if (selectedNode.value?.id === nodeId) selectedNode.value = null
}
provide('onNodeDelete', onNodeDelete)

const onNodeCopy = (nodeId: string) => {
  const source = findNode(nodeId)
  if (!source) return
  const position = { x: source.position.x + (source.dimensions?.width ?? 200) + 60, y: source.position.y }
  const newNode = {
    id: `${nodeId.split('-')[0]}-${Date.now()}`,
    type: source.type,
    position,
    data: JSON.parse(JSON.stringify(source.data)),
  }
  addNodes([newNode])
}
provide('onNodeCopy', onNodeCopy)

const onNodeOpenSettings = (nodeId: string) => {
  const node = findNode(nodeId)
  if (!node || node.type === 'trigger') return
  isAddNodeOpen.value = false
  selectedNode.value = node
}
provide('onNodeOpenSettings', onNodeOpenSettings)

// Double-click a node to open the properties panel (like n8n);
// single click just selects. Clicking the pane clears both.
const onNodeDoubleClick = (event: any) => {
  if (event.node.type === 'trigger') return
  isAddNodeOpen.value = false
  selectedNode.value = event.node
}

const onPaneClick = () => {
  selectedNode.value = null
}

const onLogNodeSelect = (nodeId: string) => {
  const node = findNode(nodeId)
  if (!node) return
  removeSelectedNodes(nodes.value)
  addSelectedNodes([node])
}

const selectedNodeExecution = computed(() => {
  if (!selectedNode.value) return null
  return lastNodeExecutions.value.get(selectedNode.value.id) ?? null
})

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const NODE_OVERLAP_MARGIN = 60
const avoidTriggerNode = (pos: { x: number, y: number }): { x: number, y: number } => {
  const trigger = findNode(TRIGGER_NODE_ID)
  if (!trigger) return pos
  const tw = (trigger.dimensions?.width ?? 230) + NODE_OVERLAP_MARGIN
  const th = (trigger.dimensions?.height ?? 60) + NODE_OVERLAP_MARGIN
  const dx = pos.x - trigger.position.x
  const dy = pos.y - trigger.position.y
  if (dx > -tw && dx < tw && dy > -th && dy < th) {
    return { x: trigger.position.x + tw, y: pos.y }
  }
  return pos
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
  const position = avoidTriggerNode(project({ x: event.clientX - 100, y: event.clientY - 100 }))
  addNodes([buildNewNode(item, position)])
  isAddNodeOpen.value = false
}

// Click-to-add from the palette: place next to the source node if triggered
// from a handle "+", otherwise at a default viewport position. When inserting
// on an edge, the new node is placed between source and target, the old edge
// is removed, and two new edges are created.
const handleAddFromPalette = (item: PaletteItem) => {
  const pending = pendingConnection.value
  const edgeInsert = pendingEdgeInsert.value
  const sourceNode = pending ? findNode(pending.sourceId) : null
  const targetNode = edgeInsert ? findNode(edgeInsert.targetId) : null

  let position: { x: number, y: number }
  if (sourceNode && targetNode) {
    position = {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    }
  }
  else if (sourceNode) {
    position = { x: sourceNode.position.x + (sourceNode.dimensions?.width ?? 200) + 100, y: sourceNode.position.y }
  }
  else {
    position = avoidTriggerNode(project({ x: 400, y: 300 }))
  }

  const newNode = buildNewNode(item, position)
  addNodes([newNode])

  if (edgeInsert) {
    const oldEdge = edges.value.find(
      e => e.source === edgeInsert.sourceId && e.target === edgeInsert.targetId,
    )
    if (oldEdge) removeEdges([oldEdge])

    addEdges([
      {
        id: `e-${edgeInsert.sourceId}-${newNode.id}-${Date.now()}`,
        source: edgeInsert.sourceId,
        sourceHandle: edgeInsert.sourceHandle ?? undefined,
        target: newNode.id,
        animated: false,
      },
      {
        id: `e-${newNode.id}-${edgeInsert.targetId}-${Date.now() + 1}`,
        source: newNode.id,
        target: edgeInsert.targetId,
        animated: false,
      },
    ])
    pendingEdgeInsert.value = null
    pendingConnection.value = null
  }
  else if (pending) {
    addEdges([{
      id: `e-${pending.sourceId}-${newNode.id}-${Date.now()}`,
      source: pending.sourceId,
      sourceHandle: pending.sourceHandle,
      target: newNode.id,
      animated: false,
    }])
    pendingConnection.value = null
  }

  isAddNodeOpen.value = false
}

// Auto-arrange nodes left-to-right using dagre. We
// wait a tick after setNodes before fitView so VueFlow has committed the
// new positions before it tries to frame them.
const tidyUp = async () => {
  setNodes(tidyUpLayout(nodes.value, edges.value))
  await nextTick()
  fitView({ padding: 0.2 })
}

const toggleAddNode = () => {
  isAddNodeOpen.value = !isAddNodeOpen.value
}

watch(isAddNodeOpen, (open) => {
  if (!open) {
    pendingConnection.value = null
    pendingEdgeInsert.value = null
  }
})

const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}

const isRunning = ref(false)
const lastExecutionId = ref<string | null>(null)
const workflowPanelLogsRef = ref<{ open: () => void, close: () => void, toggle: () => void } | null>(null)

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

// Node execution data from the last run — keyed by nodeId so the properties
// sidebar can show per-node input/output like n8n.
type NodeExecData = { input?: Record<string, unknown> | null, output?: Record<string, unknown> | null, status?: string, error?: string | null }
const lastNodeExecutions = ref<Map<string, NodeExecData>>(new Map())
provide('lastNodeExecutions', lastNodeExecutions)

// Poll the current execution's status while `isRunning` is true so the Run
// button keeps its running visual as long as the workflow is actually
// executing in the backend (not just while the start API call is in flight).
usePollWhile(
  isRunning,
  async () => {
    if (!lastExecutionId.value) return
    const details = await orchestratorApi.execution.get(lastExecutionId.value) as Record<string, unknown>
    const inner = (details?.execution as Record<string, unknown>) ?? details
    const nodeExecs = (
      Array.isArray(inner?.nodeExecutions) ? inner.nodeExecutions
      : Array.isArray(details?.nodeExecutions) ? details.nodeExecutions
      : []
    ) as Array<Record<string, unknown>>
    if (nodeExecs.length > 0) {
      const map = new Map<string, NodeExecData>()
      for (const n of nodeExecs) {
        map.set(n.nodeId as string, {
          input: n.input as Record<string, unknown> | null | undefined,
          output: n.output as Record<string, unknown> | null | undefined,
          status: n.status as string | undefined,
          error: (n.error as string | null | undefined) ?? (n.errorMessage as string | null | undefined) ?? (n.message as string | null | undefined) ?? null,
        })
      }
      lastNodeExecutions.value = map
    }
    const status = String(
      details?.orchestrationStatus ?? inner?.status ?? details?.status ?? '',
    ).toLowerCase()
    if (TERMINAL_STATUSES.has(status)) {
      isRunning.value = false
      emit('executed')
    }
  },
  2000,
)

const showDirtyRunDialog = ref(false)

// ─── Run with inputs ────────────────────────────────────────────
const workflowInputDefs = inject<Ref<WorkflowInput[]>>('workflowInputDefs', ref([]))
const showRunInputsSidebar = ref(false)
const runInputValues = ref<Record<string, unknown>>({})

function initRunInputValues() {
  const values: Record<string, unknown> = {}
  for (const input of workflowInputDefs.value) {
    values[input.name] = input.defaultValue ?? ''
  }
  runInputValues.value = values
}

const openRunWithInputs = () => {
  if (props.isNew) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be executed.',
    })
    return
  }
  initRunInputValues()
  showRunInputsSidebar.value = true
}

const executeWithInputs = async () => {
  showRunInputsSidebar.value = false
  await startExecution({ parameters: runInputValues.value })
}

const startExecution = async (data?: { parameters?: Record<string, unknown> }) => {
  try {
    const res = await orchestratorApi.execution.testRun(props.workflowId, data)
    const execId = res?.executionId ?? res?.newExecutionId ?? null
    lastExecutionId.value = execId
    isRunning.value = true
    workflowPanelLogsRef.value?.open()
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

const runWorkflow = async () => {
  if (props.isNew) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be executed.',
    })
    return
  }
  if (props.isDirty) {
    showDirtyRunDialog.value = true
    return
  }
  await startExecution()
}

const handleSaveAndRun = () => {
  showDirtyRunDialog.value = false
  emit('save-and-run')
}

const handleRunWithoutSaving = async () => {
  showDirtyRunDialog.value = false
  await startExecution()
}

// ─── Expose ──────────────────────────────────────────────────────
defineExpose({
  getGraph: () => toApi({ nodes: nodes.value, edges: edges.value }),
  startExecution,
  getUi: (): WorkflowCanvasUi => {
    const triggerNode = findNode(TRIGGER_NODE_ID)
      ?? nodes.value.find(n => n.type === 'trigger')
    const vp = getViewport()
    return {
      ...savedCanvasUi.value,
      triggerPosition: triggerNode
        ? { x: triggerNode.position.x, y: triggerNode.position.y }
        : savedCanvasUi.value.triggerPosition,
      viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
    }
  },
})

// ─── Validate ─────────────────────────────────────────────────────
const isValidating = ref(false)

const validateWorkflow = async () => {
  if (props.isNew) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be validated.',
    })
    return
  }
  isValidating.value = true
  try {
    const wf = currentWorkflow.value as Record<string, unknown> | null
    const { nodes: apiNodes, connections: apiConnections } = toApi({ nodes: nodes.value, edges: edges.value })
    const result = await orchestratorApi.workflow.validate({
      name: (wf?.name as string) ?? '',
      type: (wf?.type as string) ?? 'onDemand',
      enabled: (wf?.enabled as boolean) ?? false,
      nodes: apiNodes,
      connections: apiConnections,
      settings: (wf?.settings as Record<string, unknown>) ?? undefined,
      trigger: (wf?.trigger as Record<string, unknown>) ?? undefined,
    })
    const isValid = result.isValid ?? result.valid ?? false
    if (isValid) {
      toast({ title: 'Validation passed', description: result.message || 'Workflow is valid.' })
    }
    else {
      const errors = result.errors ?? []
      toast({
        title: 'Validation failed',
        description: result.message || `${errors.length} issue(s) found.`,
        variant: 'negative',
      })
    }
  }
  catch (err) {
    geinsLogError('Failed to validate workflow', err)
    const e = err as { originalError?: { data?: { title?: string, detail?: string } } }
    const apiBody = e?.originalError?.data
    toast({
      title: apiBody?.title || 'Validation error',
      description: apiBody?.detail || (err instanceof Error ? err.message : 'Unknown error'),
      variant: 'negative',
    })
  }
  finally {
    isValidating.value = false
  }
}

// Canvas shortcuts. Kept at the bottom so every handler referenced here is
// already declared above.
useKeybindings({
  // `+` and `-` match the produced character (via event.key), which works
  // across keyboard layouts — US Shift+= and Nordic `+` both produce '+',
  // while on Swedish the `+` key's physical code is 'Minus' so matching
  // by code would mis-route it to zoom-out. We keep `=` as a US-friendly
  // alias for zoom-in without needing shift.
  '+': () => zoomIn(),
  '=': () => zoomIn(),
  '-': () => zoomOut(),
  '1': () => fitView({ padding: 0.2 }),
  'shift+alt+t': tidyUp,
  'm': toggleMinimap,
  'n': toggleAddNode,
  'mod+enter': runWorkflow,
})
</script>

<template>
  <div class="relative flex h-[calc(100vh-11rem)] flex-col border-t-1">
    <!-- Row: canvas column (VueFlow + properties panel) + add-node sidebar -->
    <div class="relative flex min-h-0 flex-1">
      <!-- Canvas column -->
      <div class="relative flex min-w-0 flex-1 flex-col">
        <div class="relative flex-1 overflow-hidden" @dragover="onDragOver" @drop="onDrop">
          <VueFlow
:nodes="initialNodes" :edges="initialEdges" :node-types="nodeTypes" :edge-types="edgeTypes"
            :default-viewport="{ zoom: 0.8, x: 0, y: 0 }" :min-zoom="0.1" :max-zoom="maxZoom"
            class="bg-muted/30" @node-double-click="onNodeDoubleClick" @pane-click="onPaneClick">
            <Background pattern-color="hsl(var(--border))" :gap="20" />
            <!-- `show-*="false"` hides VueFlow's built-in buttons so we can
                 render our own and attach the shared KeyboardShortcutTooltip
                 to each (the defaults use native title attributes only). -->
            <Controls position="bottom-left" :show-zoom="false" :show-fit-view="false" :show-interactive="false">
              <KeyboardShortcutTooltip label="Zoom in" keys="+">
                <ControlButton @click="zoomIn()">
                  <LucideZoomIn class="h-4 w-4" />
                </ControlButton>
              </KeyboardShortcutTooltip>
              <KeyboardShortcutTooltip label="Zoom out" keys="-">
                <ControlButton @click="zoomOut()">
                  <LucideZoomOut class="h-4 w-4" />
                </ControlButton>
              </KeyboardShortcutTooltip>
              <KeyboardShortcutTooltip label="Fit view" keys="1">
                <ControlButton @click="fitView({ padding: 0.2 })">
                  <LucideMaximize class="h-4 w-4" />
                </ControlButton>
              </KeyboardShortcutTooltip>
              <KeyboardShortcutTooltip label="Tidy up" keys="shift+alt+t">
                <ControlButton @click="tidyUp">
                  <LucideWandSparkles class="h-4 w-4" />
                </ControlButton>
              </KeyboardShortcutTooltip>
              <KeyboardShortcutTooltip :label="showMinimap ? 'Hide minimap' : 'Show minimap'" keys="m">
                <ControlButton @click="toggleMinimap">
                  <LucideMap class="h-4 w-4" />
                </ControlButton>
              </KeyboardShortcutTooltip>
            </Controls>
            <MiniMap
v-if="showMinimap" position="bottom-right" :node-color="(node: any) => {
              if (node.type === 'trigger') return 'hsl(142 76% 36%)'
              if (node.type === 'condition') return 'hsl(48 96% 53%)'
              if (node.type === 'iterator' || node.type === 'loop') return 'hsl(280 67% 60%)'
              if (node.type === 'delay') return 'hsl(25 95% 53%)'
              if (node.type === 'workflow') return 'hsl(172 66% 50%)'
              if (node.type === 'paginator') return 'hsl(239 84% 67%)'
              return 'hsl(217 91% 60%)'
            }" />
          </VueFlow>

          <div class="pointer-events-none absolute top-4 right-3 z-10 flex flex-col gap-2 @2xl:right-8">
            <KeyboardShortcutTooltip :label="isAddNodeOpen ? 'Close add node' : 'Add node'" keys="n">
              <button
                class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
                @click="toggleAddNode">
                <LucidePlus class="h-4 w-4" />
              </button>
            </KeyboardShortcutTooltip>
            <KeyboardShortcutTooltip :label="isNew ? 'Save workflow to validate' : isValidating ? 'Validating…' : 'Validate workflow'" keys="">
              <button
                class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
                :class="{ 'cursor-not-allowed opacity-50': isNew }" :disabled="isValidating || isNew" @click="validateWorkflow">
                <LucideLoader2 v-if="isValidating" class="h-4 w-4 animate-spin" />
                <LucideShieldCheck v-else class="h-4 w-4" />
              </button>
            </KeyboardShortcutTooltip>
            <KeyboardShortcutTooltip
:label="isNew ? 'Save workflow to run' : isRunning ? 'Running…' : 'Run workflow'"
              keys="mod+enter">
              <button
                class="bg-background pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-red-500 shadow-sm hover:bg-red-800"
                :class="{ 'cursor-not-allowed opacity-50': isNew }" :disabled="isRunning || isNew" @click="runWorkflow">
                <LucideLoader2 v-if="isRunning" class="h-4 w-4 animate-spin text-white" />
                <LucidePlay v-else class="h-4 w-4 text-white" />
              </button>
            </KeyboardShortcutTooltip>
            <KeyboardShortcutTooltip
              :label="isNew ? 'Save workflow to run' : 'Run with inputs'"
              keys="">
              <button
                class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
                :class="{ 'cursor-not-allowed opacity-50': isNew }" :disabled="isRunning || isNew" @click="openRunWithInputs">
                <LucidePlayCircle class="h-4 w-4" />
              </button>
            </KeyboardShortcutTooltip>
          </div>

          <WorkflowSidebarNodeProperties
:node="selectedNode" :node-execution="selectedNodeExecution"
            @close="selectedNode = null" />
        </div>
      </div>

      <WorkflowSidebarAddNode v-model:open="isAddNodeOpen" @add="handleAddFromPalette" />
    </div>

    <WorkflowPanelLogs ref="workflowPanelLogsRef" :execution-id="lastExecutionId" @select:node="onLogNodeSelect" />

    <AlertDialog v-model:open="showDirtyRunDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            This workflow has unsaved changes. Would you like to save before running?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" @click="handleRunWithoutSaving">Run without saving</Button>
          <Button @click="handleSaveAndRun">Save & Run</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Sheet v-model:open="showRunInputsSidebar">
      <SheetContent width="medium">
        <SheetHeader>
          <SheetTitle>Run with inputs</SheetTitle>
          <SheetDescription>Set input values for this execution. Default values are pre-filled.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div v-if="workflowInputDefs.length === 0" class="text-muted-foreground py-8 text-center text-sm">
            This workflow has no input variables defined.
          </div>
          <div v-else class="space-y-4">
            <div v-for="input in workflowInputDefs" :key="input.name" class="space-y-1.5">
              <label class="text-sm font-medium">
                {{ input.name }}
                <span v-if="input.required" class="text-destructive">*</span>
              </label>
              <p v-if="input.description" class="text-muted-foreground text-xs">{{ input.description }}</p>
              <Textarea
                v-if="input.type === 'object' || input.type === 'json'"
                :model-value="typeof runInputValues[input.name] === 'string' ? runInputValues[input.name] as string : JSON.stringify(runInputValues[input.name], null, 2)"
                rows="4"
                class="font-mono text-xs"
                @update:model-value="runInputValues[input.name] = $event"
              />
              <Input
                v-else-if="input.type === 'number' || input.type === 'integer'"
                type="number"
                :model-value="runInputValues[input.name] as number"
                @update:model-value="runInputValues[input.name] = Number($event)"
              />
              <div v-else-if="input.type === 'boolean'" class="flex items-center gap-2">
                <Switch
                  :checked="!!runInputValues[input.name]"
                  @update:checked="runInputValues[input.name] = $event"
                />
                <span class="text-muted-foreground text-xs">{{ runInputValues[input.name] ? 'true' : 'false' }}</span>
              </div>
              <Input
                v-else
                :model-value="runInputValues[input.name] as string"
                @update:model-value="runInputValues[input.name] = $event"
              />
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" @click="showRunInputsSidebar = false">Cancel</Button>
          <Button class="bg-red-500 hover:bg-red-800" @click="executeWithInputs">
            <LucidePlay class="mr-1.5 h-3.5 w-3.5" />
            Run workflow
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style>
.vue-flow__edge-path {
  stroke-width: 2;
}

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

/* Match the top-right floating buttons (`h-9 w-9`). VueFlow's default
   control buttons are ~27px; we expand them so both sides of the canvas
   feel balanced. */
.vue-flow__controls-button {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

.vue-flow__controls-button>svg {
  width: 1rem;
  height: 1rem;
  max-width: 1rem;
  max-height: 1rem;
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

.vue-flow__connection-path {
  stroke-width: 2;
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
