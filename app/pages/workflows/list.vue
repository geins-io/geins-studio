<script setup lang="ts">
const { t } = useI18n();
const router = useRouter();

definePageMeta({
  pageType: 'list',
});

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  nodeCount: number;
  triggerType: string;
  lastRun: string | null;
  lastRunStatus: 'success' | 'failed' | null;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Mock workflows data
const workflows = ref<Workflow[]>([
  {
    id: '1',
    name: 'Customer Onboarding',
    description: 'Send welcome email and create account on third-party services',
    status: 'active',
    nodeCount: 5,
    triggerType: 'Webhook',
    lastRun: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    lastRunStatus: 'success',
    executionCount: 1245,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '2',
    name: 'Daily Report Generator',
    description: 'Generate and send daily sales reports to the team',
    status: 'active',
    nodeCount: 8,
    triggerType: 'Schedule',
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    lastRunStatus: 'success',
    executionCount: 892,
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-25T16:45:00Z',
  },
  {
    id: '3',
    name: 'Order Processing',
    description: 'Process new orders and sync with inventory system',
    status: 'active',
    nodeCount: 12,
    triggerType: 'Webhook',
    lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    lastRunStatus: 'failed',
    executionCount: 3567,
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-02-02T11:20:00Z',
  },
  {
    id: '4',
    name: 'Support Ticket Automation',
    description: 'Auto-assign and categorize incoming support tickets',
    status: 'inactive',
    nodeCount: 6,
    triggerType: 'Email',
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastRunStatus: 'success',
    executionCount: 456,
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-28T09:15:00Z',
  },
  {
    id: '5',
    name: 'Backup Workflow',
    description: 'Backup database and files to cloud storage',
    status: 'draft',
    nodeCount: 3,
    triggerType: 'Manual',
    lastRun: null,
    lastRunStatus: null,
    executionCount: 0,
    createdAt: '2024-02-01T16:00:00Z',
    updatedAt: '2024-02-01T16:00:00Z',
  },
]);

const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive' | 'draft'>('all');

// Computed stats
const stats = computed(() => ({
  total: workflows.value.length,
  active: workflows.value.filter((w) => w.status === 'active').length,
  totalExecutions: workflows.value.reduce((sum, w) => sum + w.executionCount, 0),
  failedRecently: workflows.value.filter((w) => w.lastRunStatus === 'failed').length,
}));

// Filtered workflows
const filteredWorkflows = computed(() => {
  return workflows.value.filter((workflow) => {
    const matchesSearch =
      !searchQuery.value ||
      workflow.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === 'all' || workflow.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

// Format timestamp
const formatTime = (isoString: string | null) => {
  if (!isoString) return 'Never';

  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
};

// Status badge variant
const getStatusVariant = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    draft: 'outline',
  };
  return variants[status] || 'secondary';
};

// Trigger icon
const getTriggerIcon = (trigger: string) => {
  const icons: Record<string, string> = {
    Webhook: 'LucideWebhook',
    Schedule: 'LucideClock',
    Manual: 'LucidePlay',
    Email: 'LucideMail',
  };
  return icons[trigger] || 'LucideZap';
};

// Actions
const toggleWorkflowStatus = (workflow: Workflow) => {
  workflow.status = workflow.status === 'active' ? 'inactive' : 'active';
};

const duplicateWorkflow = (workflow: Workflow) => {
  const newWorkflow: Workflow = {
    ...workflow,
    id: Date.now().toString(),
    name: `${workflow.name} (Copy)`,
    status: 'draft',
    executionCount: 0,
    lastRun: null,
    lastRunStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.value.push(newWorkflow);
};

const deleteWorkflow = (workflow: Workflow) => {
  const index = workflows.value.findIndex((w) => w.id === workflow.id);
  if (index !== -1) {
    workflows.value.splice(index, 1);
  }
};

const editWorkflow = (workflow: Workflow) => {
  router.push(`/workflows/${workflow.id}`);
};

const createWorkflow = () => {
  router.push('/workflows/new');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Workflows</h1>
        <p class="text-muted-foreground text-sm">
          Create and manage automation workflows
        </p>
      </div>
      <Button @click="createWorkflow">
        <LucidePlus class="mr-2 size-4" />
        Create Workflow
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div
              class="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg"
            >
              <LucideWorkflow class="size-6" />
            </div>
            <div>
              <p class="text-muted-foreground text-sm">Total Workflows</p>
              <p class="text-2xl font-semibold">{{ stats.total }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div
              class="flex size-12 items-center justify-center rounded-lg bg-[hsl(142_76%_36%)]/10 text-[hsl(142_76%_36%)]"
            >
              <LucideCheckCircle class="size-6" />
            </div>
            <div>
              <p class="text-muted-foreground text-sm">Active</p>
              <p class="text-2xl font-semibold">{{ stats.active }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div
              class="flex size-12 items-center justify-center rounded-lg bg-[hsl(217_91%_60%)]/10 text-[hsl(217_91%_60%)]"
            >
              <LucideActivity class="size-6" />
            </div>
            <div>
              <p class="text-muted-foreground text-sm">Total Executions</p>
              <p class="text-2xl font-semibold">
                {{ stats.totalExecutions.toLocaleString() }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div
              class="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-lg"
            >
              <LucideAlertCircle class="size-6" />
            </div>
            <div>
              <p class="text-muted-foreground text-sm">Failed Recently</p>
              <p class="text-2xl font-semibold">{{ stats.failedRecently }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <LucideSearch
          class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search workflows..."
          class="pl-9"
        />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Workflow Grid -->
    <div
      v-if="filteredWorkflows.length > 0"
      class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
    >
      <Card
        v-for="workflow in filteredWorkflows"
        :key="workflow.id"
        class="hover:border-primary/50 cursor-pointer transition-colors"
        @click="editWorkflow(workflow)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-base">{{ workflow.name }}</CardTitle>
              <CardDescription class="line-clamp-2">
                {{ workflow.description }}
              </CardDescription>
            </div>
            <Badge :variant="getStatusVariant(workflow.status)" class="capitalize">
              {{ workflow.status }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Info row -->
          <div class="text-muted-foreground flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1">
              <component :is="getTriggerIcon(workflow.triggerType)" class="size-3.5" />
              <span>{{ workflow.triggerType }}</span>
            </div>
            <div class="flex items-center gap-1">
              <LucideGitBranch class="size-3.5" />
              <span>{{ workflow.nodeCount }} nodes</span>
            </div>
          </div>

          <!-- Last run -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Last run</span>
            <div class="flex items-center gap-2">
              <span>{{ formatTime(workflow.lastRun) }}</span>
              <div
                v-if="workflow.lastRunStatus"
                :class="[
                  'size-2 rounded-full',
                  workflow.lastRunStatus === 'success'
                    ? 'bg-[hsl(142_76%_36%)]'
                    : 'bg-destructive',
                ]"
              />
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-between border-t pt-3"
            @click.stop
          >
            <span class="text-muted-foreground text-xs">
              {{ workflow.executionCount.toLocaleString() }} executions
            </span>
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                @click="toggleWorkflowStatus(workflow)"
              >
                <LucidePause
                  v-if="workflow.status === 'active'"
                  class="size-4"
                />
                <LucidePlay v-else class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                @click="editWorkflow(workflow)"
              >
                <LucidePencil class="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8">
                    <LucideMoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="duplicateWorkflow(workflow)">
                    <LucideCopy class="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="deleteWorkflow(workflow)"
                  >
                    <LucideTrash2 class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else class="py-12">
      <CardContent class="text-center">
        <LucideWorkflow class="text-muted-foreground/50 mx-auto mb-4 size-12" />
        <h3 class="mb-1 text-lg font-medium">No workflows found</h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first workflow'
          }}
        </p>
        <Button v-if="!searchQuery && statusFilter === 'all'" @click="createWorkflow">
          <LucidePlus class="mr-2 size-4" />
          Create Workflow
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
