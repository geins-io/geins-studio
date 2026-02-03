<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  Workflow,
} from 'lucide-vue-next'
import {
  Card,
  CardContent,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface NodeExecution {
  nodeId: string
  nodeName: string
  nodeType: string
  status: 'success' | 'failed' | 'running' | 'skipped'
  startedAt: string
  duration: string
  input?: any
  output?: any
  error?: string
}

interface Execution {
  id: string
  workflowId: string
  workflowName: string
  status: 'success' | 'failed' | 'running' | 'waiting'
  startedAt: string
  finishedAt: string | null
  duration: string
  trigger: string
  error?: string
  nodeExecutions: NodeExecution[]
}

const executions = ref<Execution[]>([
  {
    id: 'exec-001',
    workflowId: '1',
    workflowName: 'New User Onboarding',
    status: 'success',
    startedAt: '2025-01-31 11:45:23',
    finishedAt: '2025-01-31 11:45:25',
    duration: '1.8s',
    trigger: 'Webhook',
    nodeExecutions: [
      { nodeId: '1', nodeName: 'Webhook', nodeType: 'trigger', status: 'success', startedAt: '11:45:23', duration: '0.1s' },
      { nodeId: '2', nodeName: 'Transform Data', nodeType: 'action', status: 'success', startedAt: '11:45:23', duration: '0.3s' },
      { nodeId: '3', nodeName: 'Check Status', nodeType: 'condition', status: 'success', startedAt: '11:45:24', duration: '0.1s' },
      { nodeId: '4', nodeName: 'Send Email', nodeType: 'action', status: 'success', startedAt: '11:45:24', duration: '1.2s' },
    ],
  },
  {
    id: 'exec-002',
    workflowId: '2',
    workflowName: 'Order Processing',
    status: 'running',
    startedAt: '2025-01-31 11:44:10',
    finishedAt: null,
    duration: '1m 15s',
    trigger: 'Webhook',
    nodeExecutions: [
      { nodeId: '1', nodeName: 'Webhook', nodeType: 'trigger', status: 'success', startedAt: '11:44:10', duration: '0.1s' },
      { nodeId: '2', nodeName: 'Validate Order', nodeType: 'action', status: 'success', startedAt: '11:44:10', duration: '0.5s' },
      { nodeId: '3', nodeName: 'Check Inventory', nodeType: 'condition', status: 'success', startedAt: '11:44:11', duration: '0.8s' },
      { nodeId: '4', nodeName: 'Process Payment', nodeType: 'action', status: 'running', startedAt: '11:44:12', duration: '...' },
    ],
  },
  {
    id: 'exec-003',
    workflowId: '4',
    workflowName: 'Failed Payment Recovery',
    status: 'failed',
    startedAt: '2025-01-31 11:30:00',
    finishedAt: '2025-01-31 11:30:05',
    duration: '4.8s',
    trigger: 'Schedule',
    error: 'SMTP connection timeout after 5 retries',
    nodeExecutions: [
      { nodeId: '1', nodeName: 'Schedule Trigger', nodeType: 'trigger', status: 'success', startedAt: '11:30:00', duration: '0.1s' },
      { nodeId: '2', nodeName: 'Fetch Failed Payments', nodeType: 'action', status: 'success', startedAt: '11:30:00', duration: '1.2s' },
      { nodeId: '3', nodeName: 'Loop Payments', nodeType: 'loop', status: 'success', startedAt: '11:30:01', duration: '0.1s' },
      { nodeId: '4', nodeName: 'Send Reminder', nodeType: 'action', status: 'failed', startedAt: '11:30:02', duration: '3.2s', error: 'SMTP connection timeout' },
      { nodeId: '5', nodeName: 'Update Status', nodeType: 'action', status: 'skipped', startedAt: '-', duration: '-' },
    ],
  },
  {
    id: 'exec-004',
    workflowId: '1',
    workflowName: 'New User Onboarding',
    status: 'success',
    startedAt: '2025-01-31 11:15:00',
    finishedAt: '2025-01-31 11:15:02',
    duration: '2.1s',
    trigger: 'Webhook',
    nodeExecutions: [
      { nodeId: '1', nodeName: 'Webhook', nodeType: 'trigger', status: 'success', startedAt: '11:15:00', duration: '0.1s' },
      { nodeId: '2', nodeName: 'Transform Data', nodeType: 'action', status: 'success', startedAt: '11:15:00', duration: '0.4s' },
      { nodeId: '3', nodeName: 'Check Status', nodeType: 'condition', status: 'success', startedAt: '11:15:01', duration: '0.1s' },
      { nodeId: '4', nodeName: 'Send Email', nodeType: 'action', status: 'success', startedAt: '11:15:01', duration: '1.4s' },
    ],
  },
  {
    id: 'exec-005',
    workflowId: '3',
    workflowName: 'Daily Report Generator',
    status: 'success',
    startedAt: '2025-01-31 09:00:00',
    finishedAt: '2025-01-31 09:00:12',
    duration: '12.3s',
    trigger: 'Schedule',
    nodeExecutions: [
      { nodeId: '1', nodeName: 'Schedule (9 AM)', nodeType: 'trigger', status: 'success', startedAt: '09:00:00', duration: '0.1s' },
      { nodeId: '2', nodeName: 'Query Sales Data', nodeType: 'action', status: 'success', startedAt: '09:00:00', duration: '3.2s' },
      { nodeId: '3', nodeName: 'Generate Report', nodeType: 'action', status: 'success', startedAt: '09:00:04', duration: '5.8s' },
      { nodeId: '4', nodeName: 'Send Email', nodeType: 'action', status: 'success', startedAt: '09:00:10', duration: '2.1s' },
    ],
  },
])

const searchQuery = ref('')
const statusFilter = ref<string>('')
const workflowFilter = ref<string>('')
const expandedExecutions = ref<Set<string>>(new Set())

const filteredExecutions = computed(() => {
  return executions.value.filter(exec => {
    const matchesSearch = !searchQuery.value || 
      exec.workflowName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      exec.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || exec.status === statusFilter.value
    const matchesWorkflow = !workflowFilter.value || exec.workflowId === workflowFilter.value
    return matchesSearch && matchesStatus && matchesWorkflow
  })
})

const workflows = computed(() => {
  const unique = new Map<string, string>()
  executions.value.forEach(exec => {
    unique.set(exec.workflowId, exec.workflowName)
  })
  return Array.from(unique.entries()).map(([id, name]) => ({ id, name }))
})

const statusColors: Record<string, string> = {
  success: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
  running: 'bg-blue-500/10 text-blue-500',
  waiting: 'bg-yellow-500/10 text-yellow-500',
  skipped: 'bg-gray-500/10 text-gray-400',
}

const statusIcons: Record<string, any> = {
  success: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  waiting: Clock,
  skipped: AlertCircle,
}

const toggleExpand = (id: string) => {
  if (expandedExecutions.value.has(id)) {
    expandedExecutions.value.delete(id)
  } else {
    expandedExecutions.value.add(id)
  }
}

const stats = computed(() => ({
  total: executions.value.length,
  success: executions.value.filter(e => e.status === 'success').length,
  failed: executions.value.filter(e => e.status === 'failed').length,
  running: executions.value.filter(e => e.status === 'running').length,
}))
</script>

<template>
  <div>
    <ContentHeader title="Execution History" description="Monitor workflow executions and debug failures." />

    <!-- Stats -->
    <div class="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Executions</p>
              <p class="text-2xl font-bold">{{ stats.total }}</p>
            </div>
            <Workflow class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Successful</p>
              <p class="text-2xl font-bold text-green-500">{{ stats.success }}</p>
            </div>
            <CheckCircle2 class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Failed</p>
              <p class="text-2xl font-bold text-red-500">{{ stats.failed }}</p>
            </div>
            <XCircle class="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Running</p>
              <p class="text-2xl font-bold text-blue-500">{{ stats.running }}</p>
            </div>
            <RefreshCw class="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <CardContent class="py-4">
        <div class="flex items-center gap-4">
          <div class="relative flex-1 max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Search executions..."
              class="pl-9"
            />
          </div>
          <select
            v-model="statusFilter"
            class="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
          </select>
          <select
            v-model="workflowFilter"
            class="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Workflows</option>
            <option v-for="wf in workflows" :key="wf.id" :value="wf.id">
              {{ wf.name }}
            </option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw class="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Executions List -->
    <Card>
      <CardContent class="p-0">
        <div class="divide-y">
          <div
            v-for="execution in filteredExecutions"
            :key="execution.id"
            class="p-4"
          >
            <!-- Execution Header -->
            <div 
              class="flex items-center gap-4 cursor-pointer"
              @click="toggleExpand(execution.id)"
            >
              <button class="p-1 hover:bg-accent rounded">
                <ChevronRight 
                  v-if="!expandedExecutions.has(execution.id)"
                  class="h-4 w-4 text-muted-foreground" 
                />
                <ChevronDown 
                  v-else
                  class="h-4 w-4 text-muted-foreground" 
                />
              </button>
              
              <div 
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-500': execution.status === 'success',
                  'bg-red-500': execution.status === 'failed',
                  'bg-blue-500 animate-pulse': execution.status === 'running',
                }"
              />

              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ execution.workflowName }}</span>
                  <span 
                    :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusColors[execution.status]]"
                  >
                    {{ execution.status }}
                  </span>
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ execution.startedAt }} · {{ execution.trigger }} · {{ execution.duration }}
                </div>
              </div>

              <div class="text-xs font-mono text-muted-foreground">
                {{ execution.id }}
              </div>

              <NuxtLink :to="`/workflows/${execution.workflowId}`">
                <Button variant="ghost" size="sm" @click.stop>
                  <Eye class="h-4 w-4" />
                </Button>
              </NuxtLink>
            </div>

            <!-- Error Message -->
            <div v-if="execution.error" class="mt-2 ml-12 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
              {{ execution.error }}
            </div>

            <!-- Expanded Node Executions -->
            <div v-if="expandedExecutions.has(execution.id)" class="mt-4 ml-12 space-y-2">
              <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Node Executions
              </div>
              <div
                v-for="node in execution.nodeExecutions"
                :key="node.nodeId"
                class="flex items-center gap-3 p-2 rounded-md bg-muted/50"
              >
                <component 
                  :is="statusIcons[node.status]" 
                  class="h-4 w-4"
                  :class="{
                    'text-green-500': node.status === 'success',
                    'text-red-500': node.status === 'failed',
                    'text-blue-500 animate-spin': node.status === 'running',
                    'text-gray-400': node.status === 'skipped',
                  }"
                />
                <div class="flex-1">
                  <span class="text-sm font-medium">{{ node.nodeName }}</span>
                  <span class="text-xs text-muted-foreground ml-2">({{ node.nodeType }})</span>
                </div>
                <span class="text-xs text-muted-foreground">{{ node.startedAt }}</span>
                <span class="text-xs font-mono">{{ node.duration }}</span>
                <span 
                  :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusColors[node.status]]"
                >
                  {{ node.status }}
                </span>
              </div>
              <div
                v-for="node in execution.nodeExecutions.filter(n => n.error)"
                :key="node.nodeId + '-error'"
                class="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-md"
              >
                {{ node.nodeName }}: {{ node.error }}
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredExecutions.length === 0" class="p-12 text-center">
            <Clock class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-medium mb-2">No executions found</h3>
            <p class="text-muted-foreground">
              {{ searchQuery || statusFilter || workflowFilter ? 'Try adjusting your filters' : 'Workflow executions will appear here' }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
