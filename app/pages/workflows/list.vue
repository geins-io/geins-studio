<script setup lang="ts">
import { ref } from 'vue'
import { 
  Plus, 
  Play, 
  Pause,
  Pencil, 
  Trash2, 
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  Workflow,
  Search,
} from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface WorkflowItem {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  lastRun: string | null
  lastRunStatus: 'success' | 'failed' | 'running' | null
  runs: number
  createdAt: string
  updatedAt: string
  nodes: number
  trigger: string
}

const workflows = ref<WorkflowItem[]>([
  {
    id: '1',
    name: 'New User Onboarding',
    description: 'Send welcome email and create user profile when new signup',
    status: 'active',
    lastRun: '2 minutes ago',
    lastRunStatus: 'success',
    runs: 1247,
    createdAt: '2024-12-01',
    updatedAt: '2025-01-15',
    nodes: 5,
    trigger: 'Webhook',
  },
  {
    id: '2',
    name: 'Order Processing',
    description: 'Process new orders, update inventory, and notify warehouse',
    status: 'active',
    lastRun: '15 minutes ago',
    lastRunStatus: 'success',
    runs: 3892,
    createdAt: '2024-11-15',
    updatedAt: '2025-01-20',
    nodes: 8,
    trigger: 'Webhook',
  },
  {
    id: '3',
    name: 'Daily Report Generator',
    description: 'Generate and email daily sales report at 9 AM',
    status: 'active',
    lastRun: '5 hours ago',
    lastRunStatus: 'success',
    runs: 45,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-25',
    nodes: 4,
    trigger: 'Schedule',
  },
  {
    id: '4',
    name: 'Failed Payment Recovery',
    description: 'Send reminder emails for failed payments',
    status: 'active',
    lastRun: '1 hour ago',
    lastRunStatus: 'failed',
    runs: 234,
    createdAt: '2024-10-20',
    updatedAt: '2025-01-18',
    nodes: 6,
    trigger: 'Schedule',
  },
  {
    id: '5',
    name: 'Slack Notifications',
    description: 'Send Slack alerts for critical system events',
    status: 'inactive',
    lastRun: '3 days ago',
    lastRunStatus: 'success',
    runs: 892,
    createdAt: '2024-09-10',
    updatedAt: '2024-12-01',
    nodes: 3,
    trigger: 'Webhook',
  },
  {
    id: '6',
    name: 'Customer Feedback Loop',
    description: 'Collect and process customer feedback forms',
    status: 'draft',
    lastRun: null,
    lastRunStatus: null,
    runs: 0,
    createdAt: '2025-01-28',
    updatedAt: '2025-01-28',
    nodes: 2,
    trigger: 'Manual',
  },
])

const searchQuery = ref('')
const statusFilter = ref<string>('')

const filteredWorkflows = computed(() => {
  return workflows.value.filter(wf => {
    const matchesSearch = !searchQuery.value || 
      wf.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || wf.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  inactive: 'bg-gray-500/10 text-gray-400',
  draft: 'bg-yellow-500/10 text-yellow-500',
}

const runStatusIcons: Record<string, any> = {
  success: CheckCircle2,
  failed: XCircle,
}

const runStatusColors: Record<string, string> = {
  success: 'text-green-500',
  failed: 'text-red-500',
  running: 'text-yellow-500 animate-pulse',
}

const toggleWorkflowStatus = (workflow: WorkflowItem) => {
  if (workflow.status === 'active') {
    workflow.status = 'inactive'
  } else if (workflow.status === 'inactive') {
    workflow.status = 'active'
  }
}

const duplicateWorkflow = (workflow: WorkflowItem) => {
  const newWorkflow: WorkflowItem = {
    ...workflow,
    id: Date.now().toString(),
    name: `${workflow.name} (Copy)`,
    status: 'draft',
    lastRun: null,
    lastRunStatus: null,
    runs: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
  workflows.value.unshift(newWorkflow)
}

const deleteWorkflow = (id: string) => {
  workflows.value = workflows.value.filter(wf => wf.id !== id)
}

const stats = computed(() => ({
  total: workflows.value.length,
  active: workflows.value.filter(wf => wf.status === 'active').length,
  totalRuns: workflows.value.reduce((sum, wf) => sum + wf.runs, 0),
  failedRecent: workflows.value.filter(wf => wf.lastRunStatus === 'failed').length,
}))
</script>

<template>
  <div>
    <ContentHeader title="Workflows" description="Automate tasks with visual workflow builder.">
      <NuxtLink to="/workflows/new">
        <Button>
          <Plus class="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </NuxtLink>
    </ContentHeader>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Workflows</p>
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
              <p class="text-sm text-muted-foreground">Active</p>
              <p class="text-2xl font-bold text-green-500">{{ stats.active }}</p>
            </div>
            <Play class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Executions</p>
              <p class="text-2xl font-bold">{{ stats.totalRuns.toLocaleString() }}</p>
            </div>
            <Clock class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Failed Recently</p>
              <p class="text-2xl font-bold" :class="stats.failedRecent > 0 ? 'text-red-500' : ''">
                {{ stats.failedRecent }}
              </p>
            </div>
            <XCircle class="h-8 w-8" :class="stats.failedRecent > 0 ? 'text-red-500' : 'text-muted-foreground'" />
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
              placeholder="Search workflows..."
              class="pl-9"
            />
          </div>
          <select
            v-model="statusFilter"
            class="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Workflows Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="workflow in filteredWorkflows" 
        :key="workflow.id"
        class="hover:border-primary/50 transition-colors"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <CardTitle class="text-base">
                <NuxtLink 
                  :to="`/workflows/${workflow.id}`"
                  class="hover:underline"
                >
                  {{ workflow.name }}
                </NuxtLink>
              </CardTitle>
              <CardDescription class="line-clamp-2">
                {{ workflow.description }}
              </CardDescription>
            </div>
            <div class="flex items-center gap-1">
              <span 
                :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusColors[workflow.status]]"
              >
                {{ workflow.status }}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div class="flex items-center gap-1">
              <Workflow class="h-3.5 w-3.5" />
              <span>{{ workflow.nodes }} nodes</span>
            </div>
            <div>{{ workflow.trigger }}</div>
          </div>

          <div v-if="workflow.lastRun" class="flex items-center gap-2 text-sm mb-4">
            <component 
              :is="runStatusIcons[workflow.lastRunStatus!]" 
              class="h-4 w-4"
              :class="runStatusColors[workflow.lastRunStatus!]"
            />
            <span class="text-muted-foreground">
              Last run {{ workflow.lastRun }} · {{ workflow.runs.toLocaleString() }} total runs
            </span>
          </div>
          <div v-else class="text-sm text-muted-foreground mb-4">
            Never executed
          </div>

          <div class="flex items-center gap-2">
            <Button 
              v-if="workflow.status !== 'draft'"
              variant="outline" 
              size="sm"
              @click="toggleWorkflowStatus(workflow)"
            >
              <component :is="workflow.status === 'active' ? Pause : Play" class="h-3.5 w-3.5 mr-1" />
              {{ workflow.status === 'active' ? 'Pause' : 'Activate' }}
            </Button>
            <NuxtLink :to="`/workflows/${workflow.id}`">
              <Button variant="outline" size="sm">
                <Pencil class="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </NuxtLink>
            <Button variant="ghost" size="sm" @click="duplicateWorkflow(workflow)">
              <Copy class="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" @click="deleteWorkflow(workflow.id)">
              <Trash2 class="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-if="filteredWorkflows.length === 0" class="md:col-span-2 lg:col-span-3">
        <CardContent class="py-12">
          <div class="flex flex-col items-center justify-center text-center">
            <Workflow class="h-12 w-12 text-muted-foreground mb-4" />
            <h3 class="text-lg font-medium mb-2">No workflows found</h3>
            <p class="text-muted-foreground mb-4">
              {{ searchQuery || statusFilter ? 'Try adjusting your filters' : 'Create your first workflow to get started' }}
            </p>
            <NuxtLink v-if="!searchQuery && !statusFilter" to="/workflows/new">
              <Button>
                <Plus class="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
