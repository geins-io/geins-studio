<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow, useVueFlow, Position } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'



import {
  Play,
  Save,
  ArrowLeft,
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
import ActionNode from '~/components/workflow/ActionNode.vue'
import ConditionNode from '~/components/workflow/ConditionNode.vue'
import DelayNode from '~/components/workflow/DelayNode.vue'
import LoopNode from '~/components/workflow/LoopNode.vue'
import TriggerNode from '~/components/workflow/TriggerNode.vue'

const route = useRoute()
const router = useRouter()

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
      {
        id: '1',
        type: 'trigger',
        position: { x: 250, y: 200 },
        data: {
          label: 'Manual Trigger',
          icon: 'Zap',
          description: 'Start workflow manually',
          config: {}
        },
      },
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
const workflowName = ref(isNew.value ? 'New Workflow' : 'My Workflow')
const workflowDescription = ref('')
const isRunning = ref(false)
const isSaving = ref(false)
const activeTab = ref<'properties' | 'executions'>('properties')

// Mock execution history
const executions = ref([
  { id: '1', status: 'success', startedAt: '2025-01-31 10:30:00', duration: '1.2s', trigger: 'Webhook' },
  { id: '2', status: 'success', startedAt: '2025-01-31 10:15:00', duration: '0.8s', trigger: 'Webhook' },
  { id: '3', status: 'failed', startedAt: '2025-01-31 09:45:00', duration: '2.1s', trigger: 'Webhook', error: 'HTTP 500 from external API' },
  { id: '4', status: 'success', startedAt: '2025-01-31 09:30:00', duration: '1.5s', trigger: 'Webhook' },
  { id: '5', status: 'success', startedAt: '2025-01-31 09:00:00', duration: '0.9s', trigger: 'Manual' },
])

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

const runWorkflow = async () => {
  isRunning.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Add new execution to history
  executions.value.unshift({
    id: Date.now().toString(),
    status: Math.random() > 0.2 ? 'success' : 'failed',
    startedAt: new Date().toLocaleString(),
    duration: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
    trigger: 'Manual',
    error: undefined,
  })

  isRunning.value = false
}

const goBack = () => {
  router.push('/orchestrator/workflows')
}
</script>

<template>
  <div class="-m-6 flex h-[calc(100vh-3.5rem)]">
    <!-- Main Canvas -->
    <div class="flex flex-1 flex-col">
      <!-- Toolbar -->
      <div class="bg-background flex items-center justify-between border-b px-4 py-2">
        <div class="flex items-center gap-4">
          <button class="hover:bg-accent rounded-md p-2" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
          </button>
          <div>
            <input v-model="workflowName" type="text"
              class="focus:ring-ring rounded bg-transparent px-2 py-1 text-lg font-semibold focus:ring-2 focus:outline-none" />
            <div class="text-muted-foreground px-2 text-xs">
              {{ isNew ? 'New Workflow' : `ID: ${workflowId}` }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Add Node Button with Sheet -->
          <Sheet v-model:open="isNodePaletteOpen">
            <SheetTrigger as-child>
              <Button variant="outline" size="sm">
                <Plus class="h-4 w-4" />
                Add Node
              </Button>
            </SheetTrigger>
            <SheetContent side="right" width="medium">
              <SheetHeader>
                <SheetTitle>Add Node</SheetTitle>
                <SheetDescription>
                  Drag a node to the canvas or click to add at center
                </SheetDescription>
              </SheetHeader>
              <SheetBody class="p-0">
                <!-- Search -->
                <div class="bg-background sticky top-0 border-b p-4">
                  <div class="relative">
                    <Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <input v-model="nodeSearchQuery" type="text" placeholder="Search nodes..."
                      class="bg-background focus:ring-ring w-full rounded-md border px-9 py-2 text-sm focus:ring-2 focus:outline-none" />
                  </div>
                </div>

                <!-- Node Categories -->
                <div class="space-y-6 p-4">
                  <div v-for="category in filteredNodeTemplates" :key="category.category">
                    <div class="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                      {{ category.category }}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-for="item in category.items" :key="item.id" draggable="true"
                        class="hover:bg-accent hover:border-accent-foreground/20 group flex cursor-grab items-center gap-3 rounded-lg border px-3 py-3 transition-all"
                        @dragstart="(e) => onDragStart(e, item, category.type)"
                        @click="quickAddNode(item, category.type)">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="{
                          'bg-green-500/10 text-green-500': category.type === 'trigger',
                          'bg-blue-500/10 text-blue-500': category.type === 'action',
                          'bg-yellow-500/10 text-yellow-500': category.type === 'condition',
                          'bg-purple-500/10 text-purple-500': category.type === 'loop',
                          'bg-orange-500/10 text-orange-500': category.type === 'delay',
                        }">
                          <component :is="item.icon" class="h-5 w-5" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="truncate text-sm font-medium">{{ item.label }}</div>
                          <div class="text-muted-foreground truncate text-xs">{{ item.description }}</div>
                        </div>
                        <GripVertical
                          class="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>

                  <!-- Empty state -->
                  <div v-if="filteredNodeTemplates.length === 0" class="text-muted-foreground py-8 text-center">
                    No nodes match your search
                  </div>
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" :disabled="isSaving" @click="saveWorkflow">
            <Save class="h-4 w-4" />
            {{ isSaving ? 'Saving...' : 'Save' }}
          </Button>
          <Button size="sm" :disabled="isRunning" @click="runWorkflow">
            <Play class="h-4 w-4" :class="{ 'animate-pulse': isRunning }" />
            {{ isRunning ? 'Running...' : 'Run' }}
          </Button>
        </div>
      </div>

      <!-- VueFlow Canvas -->
      <div class="flex-1" @dragover="onDragOver" @drop="onDrop">
        <VueFlow v-if="initialNodes.length > 0" :nodes="initialNodes" :edges="initialEdges" :node-types="nodeTypes"
          :default-viewport="{ zoom: 1, x: 0, y: 0 }" :min-zoom="0.2" :max-zoom="4" fit-view-on-init class="bg-muted/30"
          @node-click="onNodeClick" @pane-click="onPaneClick">
          <Background pattern-color="hsl(var(--border))" :gap="20" />
          <Controls position="bottom-left" />
          <MiniMap position="bottom-right" :node-color="(node: any) => {
            if (node.type === 'trigger') return 'hsl(142 76% 36%)'
            if (node.type === 'condition') return 'hsl(48 96% 53%)'
            if (node.type === 'loop') return 'hsl(280 67% 60%)'
            if (node.type === 'delay') return 'hsl(25 95% 53%)'
            return 'hsl(217 91% 60%)'
          }" />
        </VueFlow>
      </div>
    </div>

    <!-- Right Sidebar: Properties / Executions -->
    <div class="bg-background w-80 overflow-y-auto border-l">
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
          @click="activeTab = 'executions'">
          <History class="mr-2 inline h-4 w-4" />
          Executions
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
        <div class="space-y-3">
          <div v-for="execution in executions" :key="execution.id"
            class="hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors">
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
            <div class="text-muted-foreground text-xs">
              {{ execution.startedAt }}
            </div>
            <div class="text-muted-foreground text-xs">
              Trigger: {{ execution.trigger }}
            </div>
            <div v-if="execution.error" class="mt-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-500">
              {{ execution.error }}
            </div>
          </div>

          <div v-if="executions.length === 0" class="text-muted-foreground py-8 text-center text-sm">
            No executions yet
          </div>
        </div>
      </div>
    </div>
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
