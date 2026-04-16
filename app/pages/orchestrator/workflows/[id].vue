<!-- eslint-disable -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Background } from '@vue-flow/background'
import { Controls, ControlButton } from '@vue-flow/controls'
import { VueFlow, useVueFlow, Position } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/sv'



import {
  Play,
  Pause,
  Save,
  Zap,
  Mail,
  MessageSquare,
  GitBranch,
  Database,
  Globe,
  Clock,
  Webhook,
  FileText,
  Repeat,
  Timer,
  Code,
  Filter,
  Merge,
  Split,
  Bell,
  Send,
  Download,
  Upload,
  Trash2,
  Settings,
  History,
  Plus,
  GripVertical,
  Search,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Map as MapIcon,
  Copy,
  Check,
  GitCommit,
  Braces,
} from 'lucide-vue-next'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '~/components/ui/sheet'
import { useToast } from '@/components/ui/toast/use-toast'
import ActionNode from '~/components/workflow/ActionNode.vue'
import ConditionNode from '~/components/workflow/ConditionNode.vue'
import DelayNode from '~/components/workflow/DelayNode.vue'
import LoopNode from '~/components/workflow/LoopNode.vue'
import TriggerNode from '~/components/workflow/TriggerNode.vue'
import LogsPanel from '~/components/workflow/LogsPanel.vue'

definePageMeta({
  pageType: 'list',
})

const route = useRoute()
const router = useRouter()
const breadcrumbsStore = useBreadcrumbsStore()
const { geinsLogError } = useGeinsLog('workflow-editor')

const workflowId = computed(() => route.params.id as string)
const isNew = computed(() => workflowId.value === 'new')

// Node types available in the palette
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  delay: DelayNode,
}

// ─── Editor manifest — real node palette, action schemas, etc. ──────
const manifestStore = useWorkflowManifest()
const { actions: manifestActions, nodeTypes: manifestNodeTypes, triggerTypes: manifestTriggerTypes, eventEntities: manifestEventEntities } = manifestStore

type PaletteItem = {
  // VueFlow node type this item should create
  nodeType: string
  // Stable id for keying in the template
  id: string
  // Display label
  label: string
  // Secondary line shown under the label
  description?: string
  // For action items: the backend `actionName` that goes into the node's config
  actionName?: string
}

type PaletteSection = {
  category: string
  items: PaletteItem[]
}

// Node types that are NOT actions — structural flow-control nodes. Triggers
// are workflow-level metadata, not nodes, so they are excluded.
const STRUCTURAL_NODE_TYPES = new Set(['condition', 'iterator', 'delay', 'workflow'])

const paletteSections = computed<PaletteSection[]>(() => {
  const sections: PaletteSection[] = []

  // Actions, grouped by their manifest category (alphabetical category order).
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

  // Structural flow-control nodes (condition, iterator, delay, workflow).
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

// Search filter for nodes
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

// Sheet open state
const isNodePaletteOpen = ref(false)

// Initial nodes and edges (empty for new, loaded for existing)
const initialNodes = ref<any[]>([])
const initialEdges = ref<any[]>([])

// Load workflow data
onMounted(() => {
  if (isNew.value) {
    // Start with just a manual trigger for new workflows
    initialNodes.value = [
    ]
  } else {
    // Demo data for existing workflow
    initialNodes.value = [
      {
        id: '1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: 'Webhook',
          icon: 'Webhook',
          description: 'Trigger on HTTP request',
          config: { method: 'POST', path: '/webhook' }
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
          config: {}
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
          config: { field: 'status', operator: 'equals', value: 'active' }
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
          config: { to: '', subject: '', body: '' }
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
          config: {}
        },
      },
    ]

    initialEdges.value = [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true', label: 'Yes' },
      { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false', label: 'No' },
    ]
  }
})

const {
  onConnect,
  addEdges,
  addNodes,
  removeNodes,
  project,
  getNodes,
  getEdges,
} = useVueFlow()

// Handle new connections
onConnect((params) => {
  addEdges([{ ...params, animated: false }])
})

// Selected node for properties panel
const selectedNode = ref<any>(null)

const onNodeClick = (event: any) => {
  selectedNode.value = event.node
  activeTab.value = 'properties'
  isSidebarOpen.value = true
}

const onPaneClick = () => {
  selectedNode.value = null
}

// Drag and drop from palette
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
  isNodePaletteOpen.value = false
}

// Quick add node (click instead of drag)
const quickAddNode = (item: PaletteItem) => {
  const position = project({ x: 400, y: 300 })
  addNodes([buildNewNode(item, position)])
  isNodePaletteOpen.value = false
}

// Delete selected node
const deleteSelectedNode = () => {
  if (selectedNode.value) {
    removeNodes([selectedNode.value.id])
    selectedNode.value = null
  }
}

// Workflow metadata
const workflowName = ref(isNew.value ? 'New Workflow' : '')
const workflowDescription = ref('')
const workflowTags = ref<string[]>([])

// Sync breadcrumb title with workflow name
watch([isNew, workflowName], ([newFlag, name]) => {
  breadcrumbsStore.setCurrentTitle(newFlag ? 'New workflow' : (name || 'Workflow'))
}, { immediate: true })
const isRunning = ref(false)
const isSaving = ref(false)
// Right sidebar tabs (only for node editing now)
const activeTab = ref<'properties' | 'add-node'>('properties')

const openAddNodeTab = () => {
  isSidebarOpen.value = true
  activeTab.value = 'add-node'
}

// Main area tabs (top-level content switcher)
const mainTabs = ['General', 'Builder', 'Inputs', 'Executions', 'History']
const currentTab = ref(0)

// Lazy-load list data when the corresponding tab is first opened.
watch(currentTab, (v) => {
  if (isNew.value) return
  if (v === 3 && !executionsLoaded.value) {
    executionsLoaded.value = true
    loadExecutions()
  }
  if (v === 4 && !historyLoaded.value) {
    historyLoaded.value = true
    loadHistory()
  }
})

// Editable state for the Inputs tab — seeded from the workflow definition.
// (Populated after `currentWorkflow` is declared via watchers below.)
const inputValues = ref<Record<string, unknown>>({})
// Editable state for the Settings tab.
const settingsValues = ref<Record<string, unknown>>({})

// ─── Trigger state ────────────────────────────────────────────────
const triggerType = ref('OnDemand')
const triggerCron = ref('')
const triggerEventEntity = ref('')
const triggerEventAction = ref('')
const triggerEventSubEntity = ref('')
const triggerDescription = ref('')

const { locale } = useI18n()
const cronDescription = computed(() => {
  const expr = triggerCron.value.trim()
  if (!expr) return ''
  try {
    return cronstrue.toString(expr, { locale: locale.value, use24HourTimeFormat: true })
  }
  catch {
    return ''
  }
})
const cronError = computed(() => {
  const expr = triggerCron.value.trim()
  if (!expr) return ''
  try {
    cronstrue.toString(expr)
    return ''
  }
  catch (err) {
    return err instanceof Error ? err.message : 'Invalid cron expression'
  }
})

// Available actions for the currently selected event entity.
const availableEventActions = computed(() => {
  if (!triggerEventEntity.value) return []
  const entity = manifestEventEntities.value.find(
    e => e.name === triggerEventEntity.value,
  )
  return entity?.actions ?? []
})

// Available sub-entities for the currently selected event entity.
const availableSubEntities = computed(() => {
  if (!triggerEventEntity.value) return []
  const entity = manifestEventEntities.value.find(
    e => e.name === triggerEventEntity.value,
  )
  return entity?.subEntities ?? []
})

const prettyLabel = (name: string): string =>
  name
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const isSidebarOpen = ref(false)
const showMinimap = ref(false)
const executionsLoaded = ref(false)
const historyLoaded = ref(false)

// Execution history (real data from API)
const { orchestratorApi } = useGeinsRepository()

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

const formatStartedAt = (iso: string | undefined): string => {
  if (!iso) return '–'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined || ms === null) return '–'
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const mapStatus = (status: string | undefined): 'success' | 'failed' | 'running' | string => {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'failed' || s === 'timedout' || s === 'canceled' || s === 'cancelled') return 'failed'
  if (s === 'running' || s === 'pending' || s === 'suspended') return 'running'
  return s || 'unknown'
}

const { data: executionsRaw, pending: executionsLoading, execute: loadExecutions, refresh: refreshExecutions } = useLazyAsyncData(
  () => `workflow-executions-${workflowId.value}`,
  () => isNew.value
    ? Promise.resolve([])
    : orchestratorApi.execution.list({ workflowId: workflowId.value }),
  { immediate: false, default: () => [] },
)

const executions = computed(() =>
  (executionsRaw.value ?? []).map((e: any) => ({
    id: e.id,
    status: mapStatus(e.status),
    startedAt: formatStartedAt(e.startTime),
    duration: formatDuration(e.durationMs),
    trigger: e.startedBy || (e.isTestRun ? 'Test run' : 'Scheduled'),
    error: Array.isArray(e.errors) && e.errors.length > 0 ? e.errors[0] : undefined,
  })),
)

// Workflow version history
const { data: historyRaw, pending: historyLoading, execute: loadHistory, refresh: refreshHistory } = useLazyAsyncData(
  () => `workflow-history-${workflowId.value}`,
  () => isNew.value
    ? Promise.resolve({ workflowId: '', versions: [] })
    : orchestratorApi.version.getHistory(workflowId.value),
  { immediate: false, default: () => ({ workflowId: '', versions: [] }) },
)

const historyVersions = computed(() => {
  const raw = historyRaw.value as any
  const list: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.versions)
      ? raw.versions
      : Array.isArray(raw)
        ? raw
        : []
  return list
    .map((v: any) => ({
      version: v.version ?? v.Version,
      createdAt: formatStartedAt(v.archivedAt ?? v.createdAt ?? v.CreatedAt),
      createdBy: v.archivedBy || v.createdBy || v.CreatedBy || null,
      description: v.description ?? v.Description ?? null,
    }))
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
})

const saveWorkflow = async () => {
  isSaving.value = true
  const workflow = {
    id: isNew.value ? Date.now().toString() : workflowId.value,
    name: workflowName.value,
    description: workflowDescription.value,
    nodes: getNodes.value,
    edges: getEdges.value,
  }
  console.log('Saving workflow:', workflow)

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  isSaving.value = false

  if (isNew.value) {
    router.replace(`/workflows/${workflow.id}`)
  }
}

const lastExecutionId = ref<string | null>(null)
const logsPanelRef = ref<{ open: () => void, close: () => void, toggle: () => void } | null>(null)

const runWorkflow = async () => {
  if (isNew.value) {
    toast({
      title: 'Save the workflow first',
      description: 'New workflows must be saved before they can be executed.',
    })
    return
  }
  isRunning.value = true
  try {
    const res = await orchestratorApi.execution.start(workflowId.value)
    const execId = res?.executionId ?? res?.newExecutionId ?? null
    lastExecutionId.value = execId
    logsPanelRef.value?.open()
    toast({
      title: 'Execution started',
      description: execId ? `ID: ${execId}` : res?.message ?? 'Workflow is running.',
    })
    await refreshExecutions()
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

// ─── Current workflow (for enable/disable + duplicate) ────────────
const { toast } = useToast()
const entityName = 'workflow'

const { data: currentWorkflow, refresh: refreshCurrentWorkflow } = await useAsyncData(
  () => `workflow-${workflowId.value}`,
  () => (isNew.value ? Promise.resolve(null) : orchestratorApi.workflow.get(workflowId.value)),
  { watch: [workflowId], getCachedData: () => undefined },
)

const isEnabled = computed(() => currentWorkflow.value?.enabled ?? false)
const menuBusy = ref(false)

// Sync workflow data into editable fields when it loads (or refreshes).
watch(
  currentWorkflow,
  (wf) => {
    if (!wf || isNew.value) return
    workflowName.value = wf.name ?? ''
    workflowDescription.value = wf.description ?? ''
    workflowTags.value = Array.isArray((wf as any)?.tags) ? [...(wf as any).tags] : []
    const raw = Array.isArray((wf as any)?.input) ? (wf as any).input : []
    const values: Record<string, unknown> = {}
    for (const i of raw) values[i.name] = i.defaultValue
    inputValues.value = values
    settingsValues.value = { ...((wf as any)?.settings ?? {}) }
    // Sync trigger fields
    triggerType.value = wf.type ?? 'OnDemand'
    triggerCron.value = wf.cronExpression ?? ''
    triggerEventEntity.value = (wf as any).eventEntity ?? ''
    triggerEventAction.value = (wf as any).eventAction ?? ''
    triggerEventSubEntity.value = (wf as any).eventSubEntity ?? ''
    triggerDescription.value = (wf as any).triggerDescription ?? ''
  },
  { immediate: true },
)

const workflowInputs = computed<any[]>(() => {
  const raw = (currentWorkflow.value as any)?.input
  return Array.isArray(raw) ? raw : []
})

const workflowInputsByCategory = computed(() => {
  const order: string[] = []
  const groups: Record<string, any[]> = {}
  for (const input of workflowInputs.value) {
    const cat = input.category || 'general'
    if (!groups[cat]) {
      groups[cat] = []
      order.push(cat)
    }
    groups[cat]!.push(input)
  }
  return order.map(category => ({ category, items: groups[category]! }))
})

// ─── Enable / Disable ─────────────────────────────────────────────
const handleToggleEnabled = async () => {
  if (isNew.value || !currentWorkflow.value) return
  menuBusy.value = true
  try {
    if (currentWorkflow.value.enabled) {
      await orchestratorApi.workflow.disable(workflowId.value)
      toast({ title: 'Workflow disabled' })
    }
    else {
      await orchestratorApi.workflow.enable(workflowId.value)
      toast({ title: 'Workflow enabled' })
    }
    await refreshCurrentWorkflow()
  }
  catch (err) {
    toast({
      title: 'Toggle failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    })
  }
  finally {
    menuBusy.value = false
  }
}

// ─── Duplicate ─────────────────────────────────────────────────────
const handleDuplicate = async () => {
  if (isNew.value || !currentWorkflow.value) return
  menuBusy.value = true
  try {
    const src = currentWorkflow.value
    const copy = await orchestratorApi.workflow.create({
      ...src,
      name: `${src.name} (copy)`,
      enabled: false,
    })
    toast({ title: 'Workflow duplicated', description: `Created "${copy.name}".` })
    await navigateTo(`/orchestrator/workflows/${copy.id}`)
  }
  catch (err) {
    toast({
      title: 'Duplicate failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    })
  }
  finally {
    menuBusy.value = false
  }
}

// ─── Delete ────────────────────────────────────────────────────────
const deleteWorkflowEntity = async (): Promise<boolean> => {
  if (isNew.value) return false
  try {
    await orchestratorApi.workflow.delete(workflowId.value)
    return true
  }
  catch {
    return false
  }
}

const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteWorkflowEntity, '/orchestrator/workflows/list')

const isSavingConfig = ref(false)
const saveWorkflowConfig = async () => {
  if (isNew.value || !currentWorkflow.value) return
  isSavingConfig.value = true
  try {
    const wf = currentWorkflow.value as any
    const mergedInputs = workflowInputs.value.map((i: any) => ({
      ...i,
      defaultValue: inputValues.value[i.name],
    }))
    await orchestratorApi.workflow.update(workflowId.value, {
      name: wf.name,
      description: wf.description,
      tags: wf.tags,
      type: triggerType.value as typeof wf.type,
      enabled: wf.enabled,
      cronExpression: triggerType.value === 'Scheduled' ? triggerCron.value : undefined,
      eventName: triggerType.value === 'Event' ? triggerEventEntity.value : undefined,
      nodes: wf.nodes,
      connections: wf.connections,
      ui: wf.ui,
      input: mergedInputs,
      settings: settingsValues.value,
    })
    await refreshCurrentWorkflow()
    toast({ title: 'Configuration saved' })
  }
  catch (err) {
    geinsLogError('Failed to save workflow configuration', err)
    toast({
      title: 'Failed to save',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'negative',
    })
  }
  finally {
    isSavingConfig.value = false
  }
}

const shortenId = (id: string, head = 12, tail = 8): string => {
  if (!id || id.length <= head + tail + 1) return id
  return `${id.slice(0, head)}…${id.slice(-tail)}`
}

const copiedId = ref(false)
const copyWorkflowId = async () => {
  try {
    await navigator.clipboard.writeText(workflowId.value)
    copiedId.value = true
    setTimeout(() => (copiedId.value = false), 1500)
  }
  catch (err) {
    geinsLogError('Failed to copy workflow ID', err)
  }
}

</script>

<template>
  <div class="-mx-3 -mb-12 flex h-[calc(100vh-3.5rem-1rem)] shrink-0 flex-col @2xl:-mx-8 @2xl:-mb-14">
    <!-- ContentHeader: title + actions + tabs (standard entity-page layout) -->
    <div>
      <ContentHeader class="px-3 @2xl:px-8" :title="isNew ? 'New workflow' : (workflowName || 'Workflow')" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon icon="save" :loading="isSaving" :disabled="isSaving" @click="saveWorkflow">{{ $t('save_entity', {
            entityName
          }) }}</ButtonIcon>
          <DropdownMenu v-if="!isNew">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink to="/orchestrator/workflows/new">
                  <LucidePlus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="menuBusy || !currentWorkflow" @click="handleDuplicate">
                <LucideCopy class="mr-2 size-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="menuBusy || !currentWorkflow" @click="handleToggleEnabled">
                <component :is="isEnabled ? Pause : Play" class="mr-2 size-4" />
                <span>{{ isEnabled ? 'Pause' : 'Start' }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContentActionBar>
        <template #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="mainTabs" />
        </template>
      </ContentHeader>
    </div>

    <!-- Body row: main column + right sidebar -->
    <div class="flex min-h-0 flex-1" :class="{ '-mt-4': currentTab === 1 }">
      <!-- Main column -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Builder tab (VueFlow) -->
        <div v-show="currentTab === 1" class="relative flex-1" @dragover="onDragOver" @drop="onDrop">
          <VueFlow :nodes="initialNodes" :edges="initialEdges" :node-types="nodeTypes"
            :default-viewport="{ zoom: 1, x: 0, y: 0 }" :min-zoom="0.1" :max-zoom="2" :fit-view-on-init="!isNew"
            class="bg-muted/30" @node-click="onNodeClick" @pane-click="onPaneClick">
            <Background pattern-color="hsl(var(--border))" :gap="20" />
            <Controls position="bottom-left">
              <ControlButton :title="showMinimap ? 'Hide minimap' : 'Show minimap'" @click="showMinimap = !showMinimap">
                <MapIcon class="h-4 w-4" />
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

          <!-- Floating top-right action column -->
          <div class="pointer-events-none absolute top-4 right-3 z-10 flex flex-col gap-2 @2xl:right-8">
            <button
              class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
              :title="isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'" @click="isSidebarOpen = !isSidebarOpen">
              <PanelRightClose v-if="isSidebarOpen" class="h-4 w-4" />
              <PanelRightOpen v-else class="h-4 w-4" />
            </button>
            <button
              class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
              title="Add node" @click="openAddNodeTab">
              <Plus class="h-4 w-4" />
            </button>
            <button
              class="bg-background pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-red-500 shadow-sm hover:bg-red-800 disabled:opacity-50"
              :disabled="isRunning || isNew"
              :title="isNew ? 'Save workflow to run' : isRunning ? 'Running…' : 'Run workflow'" @click="runWorkflow">
              <Play class="h-4 w-4 text-white" :class="{ 'animate-pulse': isRunning }" />
            </button>


          </div>
        </div>

        <!-- Inputs tab -->
        <div v-if="currentTab === 2" class="min-h-0 flex-1 overflow-y-auto">
          <div class="mx-auto max-w-4xl px-3 py-6 @2xl:px-8">
            <ContentEditMainContent>
              <ContentEditCard v-if="workflowInputs.length === 0" title="Inputs">
                <div class="text-muted-foreground py-12 text-center text-sm">
                  This workflow has no inputs
                </div>
              </ContentEditCard>
              <ContentEditCard v-for="group in workflowInputsByCategory" v-else :key="group.category"
                :title="group.category"
                :description="`${group.items.length} input${group.items.length === 1 ? '' : 's'}`">
                <template #header-action>
                  <Button variant="secondary" size="sm" @click="() => { }">
                    <Plus class="mr-2 h-3.5 w-3.5" />
                    Add input
                  </Button>
                </template>
                <FormGridWrap>
                  <div v-for="item in group.items" :key="item.name"
                    class="grid grid-cols-[20rem_1fr] items-start gap-4 border-b py-3 last:border-b-0">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="text-sm font-medium">{{ prettyLabel(item.name) }}</span>
                        <span v-if="item.required" class="text-destructive text-sm">*</span>
                      </div>
                      <div class="text-muted-foreground mt-0.5 font-mono text-[11px] break-all">
                        {{ item.name }}
                      </div>
                      <div class="mt-1 flex items-center gap-1.5">
                        <span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">{{ item.type
                        }}</span>
                      </div>
                      <div v-if="item.description" class="text-muted-foreground mt-1.5 text-xs">
                        {{ item.description }}
                      </div>
                    </div>
                    <div class="flex min-w-0 items-start">
                      <Switch v-if="item.type === 'boolean'" :model-value="!!inputValues[item.name]"
                        @update:model-value="(v: boolean) => (inputValues[item.name] = v)" />
                      <Input v-else-if="item.type === 'number'" type="number"
                        :model-value="inputValues[item.name] as any"
                        @update:model-value="(v) => (inputValues[item.name] = v === '' ? null : Number(v))" />
                      <Input v-else :model-value="inputValues[item.name] == null ? '' : String(inputValues[item.name])"
                        @update:model-value="(v) => (inputValues[item.name] = v)" />
                    </div>
                  </div>
                </FormGridWrap>
              </ContentEditCard>
              <Button variant="outline"
                class="text-muted-foreground hover:text-foreground mt-2 w-full border-dashed py-6" @click="() => { }">
                <Plus class="mr-2 h-4 w-4" />
                Add group
              </Button>
            </ContentEditMainContent>
          </div>
        </div>

        <!-- General tab -->
        <div v-if="currentTab === 0" class="min-h-0 flex-1 overflow-y-auto">
          <div class="mx-auto max-w-4xl px-3 py-6 @2xl:px-8">
            <ContentEditMainContent>
              <ContentEditCard title="General"
                description="Name, description, group, and tags used to organize this workflow.">
                <FormGridWrap>
                  <div v-if="!isNew" class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">ID</Label>
                    <div class="flex min-w-0 items-center gap-1.5">
                      <code class="bg-muted text-foreground truncate rounded px-2 py-1 font-mono text-xs"
                        :title="workflowId">{{ workflowId }}</code>
                      <button
                        class="hover:bg-muted text-muted-foreground hover:text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded"
                        :title="copiedId ? 'Copied!' : 'Copy workflow ID'" @click="copyWorkflowId">
                        <component :is="copiedId ? Check : Copy" class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Name</Label>
                    <Input v-model="workflowName" placeholder="Workflow name" />
                  </div>

                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Description</Label>
                    <Textarea v-model="workflowDescription" rows="3" placeholder="Describe what this workflow does…" />
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Group</Label>
                    <Input :model-value="(currentWorkflow as any)?.group ?? ''" placeholder="e.g. Monitor ERP Sync"
                      @update:model-value="(v) => { if (currentWorkflow) (currentWorkflow as any).group = v }" />
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Tags</Label>
                    <TagsInput v-model="workflowTags" class="min-h-10 flex-wrap">
                      <TagsInputItem v-for="tag in workflowTags" :key="tag" :value="tag">
                        <TagsInputItemText />
                        <TagsInputItemDelete />
                      </TagsInputItem>
                      <TagsInputInput placeholder="Add tag…" />
                    </TagsInput>
                  </div>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard title="Trigger" description="How and when this workflow starts.">
                <FormGridWrap>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Type</Label>
                    <Select v-model="triggerType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="tt in manifestTriggerTypes" :key="tt.type" :value="tt.type">
                          {{ tt.displayName }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- On Demand info -->
                  <div v-if="triggerType === 'OnDemand'" class="text-muted-foreground col-span-full text-sm">
                    Triggered manually via API call. No additional configuration needed.
                  </div>

                  <!-- Scheduled config -->
                  <template v-if="triggerType === 'Scheduled'">
                    <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                      <Label class="pt-2">Cron expression</Label>
                      <div class="space-y-1.5">
                        <Input v-model="triggerCron" placeholder="0 * * * * *" :class="{ 'border-destructive': cronError }" />
                        <p v-if="cronError" class="text-destructive text-xs">{{ cronError }}</p>
                        <p v-else-if="cronDescription" class="text-muted-foreground text-xs">{{ cronDescription }}</p>
                      </div>
                    </div>
                  </template>

                  <!-- Event config -->
                  <template v-if="triggerType === 'Event'">
                    <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                      <Label class="pt-2">Entity</Label>
                      <Select v-model="triggerEventEntity">
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">* (any)</SelectItem>
                          <SelectItem v-for="entity in manifestEventEntities" :key="entity.name" :value="entity.name">
                            {{ entity.displayName }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                      <Label class="pt-2">Action</Label>
                      <Select v-model="triggerEventAction">
                        <SelectTrigger>
                          <SelectValue placeholder="Select action…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">* (any)</SelectItem>
                          <SelectItem v-for="a in availableEventActions" :key="a.name" :value="a.name">
                            {{ a.displayName }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div v-if="availableSubEntities.length > 0" class="grid grid-cols-[14rem_1fr] items-start gap-4">
                      <Label class="pt-2">Sub-entity</Label>
                      <Select v-model="triggerEventSubEntity">
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="*">* (any)</SelectItem>
                          <SelectItem value="!">! (absent only)</SelectItem>
                          <SelectItem v-for="sub in availableSubEntities" :key="sub" :value="sub">
                            {{ sub }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                      <Label class="pt-2">Description</Label>
                      <Input v-model="triggerDescription" placeholder="e.g. When an order is updated" />
                    </div>
                  </template>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard title="Runtime" description="Timeout, concurrency, logging, and error handling.">
                <FormGridWrap>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Timeout</Label>
                    <Input :model-value="(settingsValues.timeout as any) ?? ''" placeholder="00:10:00"
                      @update:model-value="(v) => (settingsValues.timeout = v)" />
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Max concurrency</Label>
                    <Input v-model.number="settingsValues.maxConcurrency as any" type="number" min="1" />
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Execution log retention (days)</Label>
                    <Input v-model.number="settingsValues.executionLogRetentionDays as any" type="number" min="0"
                      placeholder="Keep indefinitely" />
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Log verbosity</Label>
                    <Select v-model="settingsValues.logVerbosity as any">
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Timeout behaviour</Label>
                    <Select v-model="settingsValues.timeoutBehavior as any">
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="continue">Continue</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Error handling</Label>
                    <Select v-model="settingsValues.errorHandlingStrategy as any">
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="failFast">Fail fast</SelectItem>
                        <SelectItem value="continue">Continue on error</SelectItem>
                        <SelectItem value="retry">Retry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard v-if="settingsValues.retryPolicy || settingsValues.rateLimit" title="Advanced"
                description="Retry and rate-limit policies.">
                <FormGridWrap>
                  <div v-if="settingsValues.retryPolicy" class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Retry policy</Label>
                    <pre class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs">{{
                      JSON.stringify(settingsValues.retryPolicy, null, 2) }}</pre>
                  </div>
                  <div v-if="settingsValues.rateLimit" class="grid grid-cols-[14rem_1fr] items-start gap-4">
                    <Label class="pt-2">Rate limit</Label>
                    <pre class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs">{{
                      JSON.stringify(settingsValues.rateLimit, null, 2) }}</pre>
                  </div>
                </FormGridWrap>
              </ContentEditCard>
            </ContentEditMainContent>
          </div>
        </div>

        <!-- Executions tab -->
        <div v-if="currentTab === 3" class="min-h-0 flex-1 overflow-y-auto">
          <div class="mx-auto max-w-4xl px-3 py-6 @2xl:px-8">
            <ContentEditMainContent>
              <ContentEditCard title="Executions" :description="`(${executions.length})`">
                <template #header-action>
                  <Button variant="secondary" size="sm" :disabled="executionsLoading" @click="refreshExecutions()">
                    <RefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': executionsLoading }" />
                    Refresh
                  </Button>
                </template>
                <div v-if="executionsLoading && executions.length === 0" class="space-y-3">
                  <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
                    <Skeleton class="mb-2 h-4 w-32" />
                    <Skeleton class="h-3 w-48" />
                  </div>
                </div>
                <div v-else class="space-y-2">
                  <NuxtLink v-for="execution in executions" :key="execution.id"
                    :to="`/orchestrator/executions/${execution.id}`"
                    class="hover:bg-muted/50 grid grid-cols-[6rem_1fr_10rem_8rem] items-center gap-4 rounded-lg border p-3 transition-colors">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full" :class="{
                        'bg-green-500': execution.status === 'success',
                        'bg-red-500': execution.status === 'failed',
                        'animate-pulse bg-yellow-500': execution.status === 'running',
                      }" />
                      <span class="text-sm font-medium capitalize">{{ execution.status }}</span>
                    </div>
                    <div class="text-muted-foreground truncate font-mono text-xs">{{ execution.startedAt }}</div>
                    <div class="text-muted-foreground truncate text-xs">Trigger: {{ execution.trigger }}</div>
                    <div class="text-muted-foreground text-right font-mono text-xs">{{ execution.duration }}</div>
                  </NuxtLink>
                  <div v-if="executions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
                    No executions yet
                  </div>
                </div>
              </ContentEditCard>
            </ContentEditMainContent>
          </div>
        </div>

        <!-- History tab -->
        <div v-if="currentTab === 4" class="min-h-0 flex-1 overflow-y-auto">
          <div class="mx-auto max-w-4xl px-3 py-6 @2xl:px-8">
            <ContentEditMainContent>
              <ContentEditCard title="Version history" :description="`(${historyVersions.length})`">
                <template #header-action>
                  <Button variant="secondary" size="sm" :disabled="historyLoading" @click="refreshHistory()">
                    <RefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': historyLoading }" />
                    Refresh
                  </Button>
                </template>
                <div v-if="historyLoading && historyVersions.length === 0" class="space-y-3">
                  <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
                    <Skeleton class="mb-2 h-4 w-16" />
                    <Skeleton class="h-3 w-48" />
                  </div>
                </div>
                <div v-else class="space-y-2">
                  <div v-for="entry in historyVersions" :key="entry.version"
                    class="grid grid-cols-[6rem_1fr_12rem] items-center gap-4 rounded-lg border p-3">
                    <div class="flex items-center gap-2">
                      <GitCommit class="text-muted-foreground h-3.5 w-3.5" />
                      <span class="text-sm font-medium">v{{ entry.version }}</span>
                    </div>
                    <div class="text-muted-foreground truncate text-xs">{{ entry.description || '—' }}</div>
                    <div class="text-muted-foreground text-right font-mono text-xs">{{ entry.createdAt }}</div>
                  </div>
                  <div v-if="historyVersions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
                    No version history
                  </div>
                </div>
              </ContentEditCard>
            </ContentEditMainContent>
          </div>
        </div>

        <!-- Bottom Logs Panel (only on Builder tab) -->
        <LogsPanel v-if="currentTab === 1" ref="logsPanelRef" :execution-id="lastExecutionId" />
      </div>

      <!-- Right Sidebar: only on Builder tab -->
      <div v-if="currentTab === 1"
        class="bg-background shrink-0 overflow-hidden border-l transition-[width] duration-200 ease-in-out"
        :class="isSidebarOpen ? 'w-80' : 'w-0 border-l-0'">
        <div class="h-full w-80 overflow-y-auto" style="scrollbar-gutter: stable;">
          <!-- Right sidebar header (only for Properties now; Add Node hides this) -->
          <div v-if="activeTab === 'properties'" class="flex items-center gap-2 border-b px-4 py-3">
            <Settings class="h-4 w-4" />
            <span class="text-sm font-medium">Node properties</span>
          </div>

          <!-- Properties Tab -->
          <div v-if="activeTab === 'properties'" class="p-4">
            <div v-if="selectedNode" class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-medium">Node Settings</h3>
                <button class="hover:bg-destructive/10 text-destructive rounded p-1.5" title="Delete node"
                  @click="deleteSelectedNode">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Name</label>
                <input v-model="selectedNode.data.label" type="text"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Description</label>
                <textarea v-model="selectedNode.data.description" rows="2"
                  class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Type</label>
                <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
                  {{ selectedNode.type }}
                </div>
              </div>

              <!-- Trigger-specific config -->
              <template v-if="selectedNode.type === 'trigger'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">Trigger Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Webhook Path</label>
                      <input v-model="selectedNode.data.config.path" type="text" placeholder="/webhook"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">HTTP Method</label>
                      <select v-model="selectedNode.data.config.method"
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

              <!-- Condition-specific config -->
              <template v-if="selectedNode.type === 'condition'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">Condition Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Field</label>
                      <input v-model="selectedNode.data.config.field" type="text" placeholder="data.status"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Operator</label>
                      <select v-model="selectedNode.data.config.operator"
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
                      <input v-model="selectedNode.data.config.value" type="text" placeholder="active"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Loop-specific config -->
              <template v-if="selectedNode.type === 'loop'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">Loop Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Items Field</label>
                      <input v-model="selectedNode.data.config.itemsField" type="text" placeholder="data.items"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Batch Size</label>
                      <input v-model="selectedNode.data.config.batchSize" type="number" placeholder="1"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Delay-specific config -->
              <template v-if="selectedNode.type === 'delay'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">Delay Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Duration</label>
                      <div class="flex gap-2">
                        <input v-model="selectedNode.data.config.duration" type="number" placeholder="5"
                          class="bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                        <select v-model="selectedNode.data.config.unit"
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

              <!-- Action-specific config (Email) -->
              <template v-if="selectedNode.type === 'action' && selectedNode.data.icon === 'Mail'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">Email Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">To</label>
                      <input v-model="selectedNode.data.config.to" type="email" placeholder="user@example.com"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Subject</label>
                      <input v-model="selectedNode.data.config.subject" type="text" placeholder="Email subject"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Body</label>
                      <textarea v-model="selectedNode.data.config.body" rows="4" placeholder="Email body..."
                        class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Action-specific config (HTTP) -->
              <template v-if="selectedNode.type === 'action' && selectedNode.data.icon === 'Globe'">
                <div class="border-t pt-4">
                  <h4 class="mb-3 text-sm font-medium">HTTP Request Settings</h4>
                  <div class="space-y-3">
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">URL</label>
                      <input v-model="selectedNode.data.config.url" type="url"
                        placeholder="https://api.example.com/endpoint"
                        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Method</label>
                      <select v-model="selectedNode.data.config.method"
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
                      <textarea v-model="selectedNode.data.config.headers" rows="2"
                        placeholder='{"Authorization": "Bearer ..."}'
                        class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-muted-foreground text-sm">Body (JSON)</label>
                      <textarea v-model="selectedNode.data.config.body" rows="4" placeholder='{"key": "value"}'
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

          <!-- Add Node Tab -->
          <div v-if="activeTab === 'add-node'" class="p-4">
            <div class="relative mb-3">
              <Search class="text-muted-foreground pointer-events-none absolute top-2.5 left-2 h-4 w-4" />
              <input v-model="nodeSearchQuery" type="text" placeholder="Search actions…"
                class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none" />
            </div>
            <div v-if="manifestStore.loading.value && paletteSections.length === 0" class="text-muted-foreground py-8 text-center text-sm">
              Loading node types…
            </div>
            <div v-else class="space-y-4">
              <div v-for="section in filteredNodeTemplates" :key="section.category">
                <div class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  {{ section.category }}
                </div>
                <div class="space-y-1.5">
                  <button v-for="item in section.items" :key="item.id"
                    class="hover:bg-muted/50 flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors"
                    draggable="true"
                    @dragstart="(e) => onDragStart(e, item)"
                    @click="quickAddNode(item)">
                    <Play class="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
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
              <div v-if="filteredNodeTemplates.length === 0 && !manifestStore.loading.value"
                class="text-muted-foreground py-8 text-center text-sm">
                No nodes match your search
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DialogDelete v-model:open="deleteDialogOpen" :entity-name="entityName" :loading="deleting"
      @confirm="confirmDelete" />
  </div>
</template>

<style>
/* VueFlow dark mode overrides */
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
</style>
