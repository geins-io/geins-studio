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



import {
  Play,
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
  MoreHorizontal,
  Trash,
  Copy,
  Check,
  Power,
  PowerOff,
  GitCommit,
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

const nodeTemplates = [
  {
    type: 'trigger', category: 'Triggers', items: [
      { id: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger on HTTP request' },
      { id: 'schedule', label: 'Schedule', icon: Clock, description: 'Trigger on cron schedule' },
      { id: 'manual', label: 'Manual', icon: Zap, description: 'Trigger manually' },
      { id: 'email_received', label: 'Email Received', icon: Mail, description: 'Trigger on email' },
    ]
  },
  {
    type: 'action', category: 'Actions', items: [
      { id: 'http', label: 'HTTP Request', icon: Globe, description: 'Make HTTP/API request' },
      { id: 'email', label: 'Send Email', icon: Mail, description: 'Send an email' },
      { id: 'slack', label: 'Slack', icon: MessageSquare, description: 'Send Slack message' },
      { id: 'discord', label: 'Discord', icon: MessageSquare, description: 'Send Discord message' },
      { id: 'database', label: 'Database Query', icon: Database, description: 'Query database' },
      { id: 'notification', label: 'Push Notification', icon: Bell, description: 'Send push notification' },
      { id: 'sms', label: 'Send SMS', icon: Send, description: 'Send SMS message' },
    ]
  },
  {
    type: 'action', category: 'Data', items: [
      { id: 'transform', label: 'Transform', icon: FileText, description: 'Transform data' },
      { id: 'code', label: 'Code', icon: Code, description: 'Run custom code' },
      { id: 'filter', label: 'Filter', icon: Filter, description: 'Filter data items' },
      { id: 'merge', label: 'Merge', icon: Merge, description: 'Merge data streams' },
      { id: 'split', label: 'Split', icon: Split, description: 'Split into batches' },
      { id: 'aggregate', label: 'Aggregate', icon: Database, description: 'Aggregate data' },
    ]
  },
  {
    type: 'action', category: 'Files', items: [
      { id: 'read_file', label: 'Read File', icon: Download, description: 'Read file contents' },
      { id: 'write_file', label: 'Write File', icon: Upload, description: 'Write to file' },
      { id: 'ftp', label: 'FTP', icon: Upload, description: 'FTP upload/download' },
      { id: 's3', label: 'S3 Storage', icon: Database, description: 'AWS S3 operations' },
    ]
  },
  {
    type: 'condition', category: 'Logic', items: [
      { id: 'if', label: 'IF Condition', icon: GitBranch, description: 'Branch based on condition' },
      { id: 'switch', label: 'Switch', icon: GitBranch, description: 'Multiple branches' },
    ]
  },
  {
    type: 'loop', category: 'Flow Control', items: [
      { id: 'loop', label: 'Loop', icon: Repeat, description: 'Iterate over items' },
      { id: 'while', label: 'While Loop', icon: Repeat, description: 'Loop while condition true' },
    ]
  },
  {
    type: 'delay', category: 'Timing', items: [
      { id: 'delay', label: 'Delay', icon: Timer, description: 'Wait for duration' },
      { id: 'wait_until', label: 'Wait Until', icon: Clock, description: 'Wait until time' },
    ]
  },
]

// Search filter for nodes
const nodeSearchQuery = ref('')
const filteredNodeTemplates = computed(() => {
  if (!nodeSearchQuery.value) return nodeTemplates
  const query = nodeSearchQuery.value.toLowerCase()
  return nodeTemplates
    .map(category => ({
      ...category,
      items: category.items.filter(
        item => item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    }))
    .filter(category => category.items.length > 0)
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
const onDragStart = (event: DragEvent, template: any, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify({ ...template, nodeType }))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow')
  if (!data) return

  const template = JSON.parse(data)
  const position = project({ x: event.clientX - 100, y: event.clientY - 100 })

  const newNode = {
    id: `${Date.now()}`,
    type: template.nodeType,
    position,
    data: {
      label: template.label,
      icon: template.icon?.name || template.id,
      description: template.description,
      config: {},
    },
  }

  addNodes([newNode])
  isNodePaletteOpen.value = false
}

// Quick add node (click instead of drag)
const quickAddNode = (template: any, nodeType: string) => {
  // Add node at a reasonable position (center-ish of viewport)
  const position = project({ x: 400, y: 300 })

  const newNode = {
    id: `${Date.now()}`,
    type: nodeType,
    position,
    data: {
      label: template.label,
      icon: template.icon?.name || template.id,
      description: template.description,
      config: {},
    },
  }

  addNodes([newNode])
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

// Sync breadcrumb title with workflow name
watch([isNew, workflowName], ([newFlag, name]) => {
  breadcrumbsStore.setCurrentTitle(newFlag ? 'New workflow' : (name || 'Workflow'))
}, { immediate: true })
const isRunning = ref(false)
const isSaving = ref(false)
const activeTab = ref<'properties' | 'executions' | 'history'>('properties')
const isSidebarOpen = ref(false)
const showMinimap = ref(false)
const executionsLoaded = ref(false)
const historyLoaded = ref(false)

const openExecutionsTab = () => {
  activeTab.value = 'executions'
  if (!executionsLoaded.value && !isNew.value) {
    executionsLoaded.value = true
    loadExecutions()
  }
}

const openHistoryTab = () => {
  activeTab.value = 'history'
  if (!historyLoaded.value && !isNew.value) {
    historyLoaded.value = true
    loadHistory()
  }
}

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
  },
  { immediate: true },
)

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
  <div class="-m-3 @2xl:-m-8 flex h-[calc(100vh-3.5rem)] shrink-0">
    <!-- Main Canvas -->
    <div class="flex flex-1 flex-col">
      <!-- Toolbar (name + save) -->
      <div class="bg-background flex items-center justify-between border-b px-4 py-2">
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-1">
            <input v-model="workflowName" type="text"
              class="focus:ring-ring w-[28rem] max-w-full rounded bg-transparent px-2 py-1 text-lg font-semibold focus:ring-2 focus:outline-none" />
            <input v-model="workflowDescription" type="text"
              :placeholder="isNew ? 'Add a description…' : 'No description'"
              class="focus:ring-ring text-muted-foreground placeholder:text-muted-foreground/60 w-[48rem] max-w-full rounded bg-transparent px-2 py-0.5 text-sm focus:ring-2 focus:outline-none" />
            <div class="text-muted-foreground flex items-center gap-1.5 px-2 font-mono text-xs">
              <template v-if="isNew">
                New Workflow
              </template>
              <template v-else>
                <span>ID:</span>
                <span :title="workflowId">{{ shortenId(workflowId) }}</span>
                <button class="hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
                  :title="copiedId ? 'Copied!' : 'Copy workflow ID'" @click="copyWorkflowId">
                  <component :is="copiedId ? Check : Copy" class="h-3 w-3" />
                </button>
                <template v-if="currentWorkflow?.group">
                  <span>•</span>
                  <span>Group: <span class="text-foreground font-medium">{{ currentWorkflow.group }}</span></span>
                </template>
                <template v-if="currentWorkflow?.tags?.length">
                  <span>•</span>
                  <div class="flex flex-wrap items-center gap-1">
                    <Badge v-for="tag in currentWorkflow.tags" :key="tag" variant="secondary"
                      class="font-sans text-[10px] font-normal">
                      {{ tag }}
                    </Badge>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ButtonIcon icon="save" :disabled="isSaving" @click="saveWorkflow">
            {{ isSaving ? 'Saving…' : $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <DropdownMenu v-if="!isNew">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <MoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink to="/orchestrator/workflows/new">
                  <Plus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="menuBusy || !currentWorkflow" @click="handleDuplicate">
                <Copy class="mr-2 size-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="menuBusy || !currentWorkflow" @click="handleToggleEnabled">
                <component :is="isEnabled ? PowerOff : Power" class="mr-2 size-4" />
                <span>{{ isEnabled ? 'Disable' : 'Enable' }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <Trash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- VueFlow Canvas -->
      <div class="relative flex-1" @dragover="onDragOver" @drop="onDrop">
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
        <div class="pointer-events-none absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm disabled:opacity-50"
            :disabled="isRunning || isNew"
            :title="isNew ? 'Save workflow to run' : isRunning ? 'Running…' : 'Run workflow'"
            @click="runWorkflow">
            <Play class="h-4 w-4" :class="{ 'animate-pulse': isRunning }" />
          </button>
          <button
            class="bg-background hover:bg-accent pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border shadow-sm"
            :title="isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
            @click="isSidebarOpen = !isSidebarOpen">
            <PanelRightClose v-if="isSidebarOpen" class="h-4 w-4" />
            <PanelRightOpen v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Bottom Logs Panel -->
      <LogsPanel ref="logsPanelRef" :execution-id="lastExecutionId" />
    </div>

    <!-- Right Sidebar: Properties / Executions -->
    <div
      class="bg-background shrink-0 overflow-hidden border-l transition-[width] duration-200 ease-in-out"
      :class="isSidebarOpen ? 'w-80' : 'w-0 border-l-0'">
      <div class="h-full w-80 overflow-y-auto" style="scrollbar-gutter: stable;">
      <!-- Tabs -->
      <div class="flex border-b">
        <button class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'properties' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'properties'">
          <Settings class="mr-2 inline h-4 w-4" />
          Properties
        </button>
        <button class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'executions' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="openExecutionsTab">
          <History class="mr-2 inline h-4 w-4" />
          Executions
        </button>
        <button class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'history' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'"
          :disabled="isNew"
          :title="isNew ? 'Save workflow to view history' : 'Workflow version history'"
          @click="openHistoryTab">
          <GitCommit class="mr-2 inline h-4 w-4" />
          History
        </button>
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

      <!-- Executions Tab -->
      <div v-if="activeTab === 'executions'" class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-muted-foreground text-xs">
            {{ executions.length }} execution{{ executions.length === 1 ? '' : 's' }}
          </span>
          <button
            class="hover:bg-accent text-muted-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs disabled:opacity-50"
            :disabled="executionsLoading"
            title="Refresh executions"
            @click="refreshExecutions()">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': executionsLoading }" />
            Refresh
          </button>
        </div>
        <div v-if="executionsLoading && executions.length === 0" class="space-y-3">
          <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Skeleton class="h-2 w-2 rounded-full" />
                <Skeleton class="h-4 w-16" />
              </div>
              <Skeleton class="h-3 w-10" />
            </div>
            <Skeleton class="mb-1 h-3 w-40" />
            <Skeleton class="h-3 w-24" />
          </div>
        </div>
        <div v-else class="space-y-3">
          <NuxtLink v-for="execution in executions" :key="execution.id"
            :to="`/orchestrator/executions/${execution.id}`"
            class="hover:bg-muted/50 block cursor-pointer rounded-lg border p-3 transition-colors">
            <div class="mb-1 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="{
                  'bg-green-500': execution.status === 'success',
                  'bg-red-500': execution.status === 'failed',
                  'animate-pulse bg-yellow-500': execution.status === 'running',
                }" />
                <span class="text-sm font-medium capitalize">{{ execution.status }}</span>
              </div>
              <span class="text-muted-foreground text-xs">{{ execution.duration }}</span>
            </div>
            <div class="text-muted-foreground font-mono text-xs">
              {{ execution.startedAt }}
            </div>
            <div class="text-muted-foreground text-xs">
              Trigger: {{ execution.trigger }}
            </div>
            <div v-if="execution.error" class="mt-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-500">
              {{ execution.error }}
            </div>
          </NuxtLink>

          <div v-if="executions.length === 0" class="text-muted-foreground py-8 text-center text-sm">
            No executions yet
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-muted-foreground text-xs">
            {{ historyVersions.length }} version{{ historyVersions.length === 1 ? '' : 's' }}
          </span>
          <button
            class="hover:bg-accent text-muted-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs disabled:opacity-50"
            :disabled="historyLoading"
            title="Refresh history"
            @click="refreshHistory()">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': historyLoading }" />
            Refresh
          </button>
        </div>
        <div v-if="historyLoading && historyVersions.length === 0" class="space-y-3">
          <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
            <div class="mb-2 flex items-center justify-between">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-3 w-20" />
            </div>
            <Skeleton class="mb-1 h-3 w-40" />
            <Skeleton class="h-3 w-24" />
          </div>
        </div>
        <div v-else class="space-y-3">
          <div v-for="entry in historyVersions" :key="entry.version"
            class="rounded-lg border p-3">
            <div class="mb-1 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <GitCommit class="text-muted-foreground h-3.5 w-3.5" />
                <span class="text-sm font-medium">v{{ entry.version }}</span>
              </div>
              <span v-if="entry.createdBy" class="text-muted-foreground text-xs">{{ entry.createdBy }}</span>
            </div>
            <div class="text-muted-foreground font-mono text-xs">
              {{ entry.createdAt }}
            </div>
            <div v-if="entry.description" class="text-muted-foreground mt-1 text-xs">
              {{ entry.description }}
            </div>
          </div>

          <div v-if="historyVersions.length === 0" class="text-muted-foreground py-8 text-center text-sm">
            No version history
          </div>
        </div>
      </div>
      </div>
    </div>

    <DialogDelete
      v-model:open="deleteDialogOpen"
      :entity-name="entityName"
      :loading="deleting"
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
