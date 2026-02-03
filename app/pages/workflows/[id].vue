<script setup lang="ts">
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

// Import workflow node components
import TriggerNode from '~/components/workflow/TriggerNode.vue';
import ActionNode from '~/components/workflow/ActionNode.vue';
import ConditionNode from '~/components/workflow/ConditionNode.vue';
import LoopNode from '~/components/workflow/LoopNode.vue';
import DelayNode from '~/components/workflow/DelayNode.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

definePageMeta({
  pageType: 'edit',
});

// Workflow state
const workflowId = computed(() => route.params.id as string);
const isNew = computed(() => workflowId.value === 'new');
const workflowName = ref('New Workflow');
const workflowDescription = ref('');
const isSaving = ref(false);
const isRunning = ref(false);
const selectedNode = ref<Node | null>(null);
const isNodePaletteOpen = ref(false);
const searchQuery = ref('');
const activeTab = ref('properties');

// Node types registration
const nodeTypes = {
  trigger: markRaw(TriggerNode),
  action: markRaw(ActionNode),
  condition: markRaw(ConditionNode),
  loop: markRaw(LoopNode),
  delay: markRaw(DelayNode),
};

// Initial nodes for demo
const initialNodes = ref<Node[]>([
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: {
      label: 'Webhook',
      icon: 'webhook',
      description: 'Trigger on HTTP request',
      config: { path: 'api/webhook' },
    },
  },
]);

const initialEdges = ref<Edge[]>([]);

// VueFlow composable
const {
  onConnect,
  addEdges,
  addNodes,
  removeNodes,
  project,
  getNodes,
  getEdges,
  fitView,
} = useVueFlow();

// Handle new connections
onConnect((params) => {
  addEdges([{ ...params, animated: false }]);
});

// Node palette templates
const nodeTemplates = [
  {
    type: 'trigger',
    category: 'Triggers',
    items: [
      {
        id: 'webhook',
        label: 'Webhook',
        icon: 'webhook',
        description: 'Trigger on HTTP request',
      },
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'schedule',
        description: 'Trigger on cron schedule',
      },
      {
        id: 'manual',
        label: 'Manual',
        icon: 'manual',
        description: 'Trigger manually',
      },
      {
        id: 'email',
        label: 'Email Received',
        icon: 'email',
        description: 'Trigger on email',
      },
    ],
  },
  {
    type: 'action',
    category: 'Actions',
    items: [
      {
        id: 'http',
        label: 'HTTP Request',
        icon: 'http',
        description: 'Make HTTP/API request',
      },
      {
        id: 'email',
        label: 'Send Email',
        icon: 'email',
        description: 'Send an email',
      },
      {
        id: 'slack',
        label: 'Slack',
        icon: 'slack',
        description: 'Send Slack message',
      },
      {
        id: 'discord',
        label: 'Discord',
        icon: 'discord',
        description: 'Send Discord message',
      },
      {
        id: 'database',
        label: 'Database',
        icon: 'database',
        description: 'Database query',
      },
      {
        id: 'notification',
        label: 'Notification',
        icon: 'notification',
        description: 'Send push notification',
      },
    ],
  },
  {
    type: 'action',
    category: 'Data',
    items: [
      {
        id: 'transform',
        label: 'Transform',
        icon: 'transform',
        description: 'Transform data',
      },
      {
        id: 'code',
        label: 'Code',
        icon: 'code',
        description: 'Execute custom code',
      },
      {
        id: 'filter',
        label: 'Filter',
        icon: 'filter',
        description: 'Filter data',
      },
    ],
  },
  {
    type: 'condition',
    category: 'Logic',
    items: [
      {
        id: 'if',
        label: 'IF Condition',
        icon: 'condition',
        description: 'Branch based on condition',
      },
    ],
  },
  {
    type: 'loop',
    category: 'Flow Control',
    items: [
      {
        id: 'loop',
        label: 'Loop',
        icon: 'loop',
        description: 'Iterate over items',
      },
    ],
  },
  {
    type: 'delay',
    category: 'Timing',
    items: [
      {
        id: 'delay',
        label: 'Delay',
        icon: 'delay',
        description: 'Wait for duration',
      },
    ],
  },
];

// Filtered templates based on search
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return nodeTemplates;

  const query = searchQuery.value.toLowerCase();
  return nodeTemplates
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => category.items.length > 0);
});

// Mock execution history
const executions = ref([
  {
    id: '1',
    status: 'success' as const,
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    duration: '2.3s',
    trigger: 'Webhook',
  },
  {
    id: '2',
    status: 'failed' as const,
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    duration: '0.8s',
    trigger: 'Schedule',
    error: 'HTTP request timeout',
  },
  {
    id: '3',
    status: 'success' as const,
    startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    duration: '1.5s',
    trigger: 'Manual',
  },
]);

// Drag & drop handlers
const onDragStart = (event: DragEvent, template: any, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData(
      'application/vueflow',
      JSON.stringify({ ...template, nodeType }),
    );
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow');
  if (!data) return;

  const template = JSON.parse(data);
  const bounds = (event.target as HTMLElement)
    .closest('.vue-flow')
    ?.getBoundingClientRect();
  if (!bounds) return;

  const position = project({
    x: event.clientX - bounds.left - 90,
    y: event.clientY - bounds.top - 40,
  });

  const newNode: Node = {
    id: `${Date.now()}`,
    type: template.nodeType,
    position,
    data: {
      label: template.label,
      icon: template.id,
      description: template.description,
      config: {},
    },
  };

  addNodes([newNode]);
  isNodePaletteOpen.value = false;
};

// Quick add node (click instead of drag)
const quickAddNode = (template: any, nodeType: string) => {
  const newNode: Node = {
    id: `${Date.now()}`,
    type: nodeType,
    position: project({ x: 400, y: 300 }),
    data: {
      label: template.label,
      icon: template.id,
      description: template.description,
      config: {},
    },
  };

  addNodes([newNode]);
  isNodePaletteOpen.value = false;
};

// Node selection
const onNodeClick = (_event: MouseEvent, node: Node) => {
  selectedNode.value = node;
  activeTab.value = 'properties';
};

const onPaneClick = () => {
  selectedNode.value = null;
};

// Delete selected node
const deleteSelectedNode = () => {
  if (selectedNode.value) {
    removeNodes([selectedNode.value.id]);
    selectedNode.value = null;
  }
};

// Update node config
const updateNodeConfig = (key: string, value: any) => {
  if (!selectedNode.value) return;

  const nodes = getNodes.value;
  const nodeIndex = nodes.findIndex((n) => n.id === selectedNode.value?.id);
  if (nodeIndex !== -1) {
    nodes[nodeIndex].data.config = {
      ...nodes[nodeIndex].data.config,
      [key]: value,
    };
    selectedNode.value = { ...nodes[nodeIndex] };
  }
};

// Update node label
const updateNodeLabel = (value: string) => {
  if (!selectedNode.value) return;

  const nodes = getNodes.value;
  const nodeIndex = nodes.findIndex((n) => n.id === selectedNode.value?.id);
  if (nodeIndex !== -1) {
    nodes[nodeIndex].data.label = value;
    selectedNode.value = { ...nodes[nodeIndex] };
  }
};

// Update node description
const updateNodeDescription = (value: string) => {
  if (!selectedNode.value) return;

  const nodes = getNodes.value;
  const nodeIndex = nodes.findIndex((n) => n.id === selectedNode.value?.id);
  if (nodeIndex !== -1) {
    nodes[nodeIndex].data.description = value;
    selectedNode.value = { ...nodes[nodeIndex] };
  }
};

// Save workflow
const saveWorkflow = async () => {
  isSaving.value = true;

  const workflow = {
    id: isNew.value ? Date.now().toString() : workflowId.value,
    name: workflowName.value,
    description: workflowDescription.value,
    nodes: getNodes.value,
    edges: getEdges.value,
    updatedAt: new Date().toISOString(),
  };

  // Simulate API call
  console.log('Saving workflow:', workflow);
  await new Promise((resolve) => setTimeout(resolve, 500));

  isSaving.value = false;

  if (isNew.value) {
    router.replace(`/workflows/${workflow.id}`);
  }
};

// Run workflow
const runWorkflow = async () => {
  isRunning.value = true;

  // Simulate running
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Add new execution to history
  executions.value.unshift({
    id: Date.now().toString(),
    status: Math.random() > 0.2 ? 'success' : 'failed',
    startedAt: new Date().toISOString(),
    duration: `${(Math.random() * 3 + 0.5).toFixed(1)}s`,
    trigger: 'Manual',
    ...(Math.random() < 0.2 && { error: 'Simulated error' }),
  });

  isRunning.value = false;
  activeTab.value = 'executions';
};

// Get node type color for minimap
const getNodeColor = (node: Node) => {
  const colors: Record<string, string> = {
    trigger: 'hsl(142 76% 36%)',
    action: 'hsl(217 91% 60%)',
    condition: 'hsl(48 96% 53%)',
    loop: 'hsl(280 67% 60%)',
    delay: 'hsl(25 95% 53%)',
  };
  return colors[node.type || 'action'] || colors.action;
};

// Get category icon
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Triggers: 'LucideZap',
    Actions: 'LucidePlay',
    Data: 'LucideDatabase',
    Logic: 'LucideGitBranch',
    'Flow Control': 'LucideRepeat',
    Timing: 'LucideTimer',
  };
  return icons[category] || 'LucideCircle';
};

// Get template icon
const getTemplateIcon = (icon: string) => {
  const icons: Record<string, string> = {
    webhook: 'LucideWebhook',
    schedule: 'LucideClock',
    manual: 'LucidePlay',
    email: 'LucideMail',
    http: 'LucideGlobe',
    slack: 'LucideMessageSquare',
    discord: 'LucideMessageCircle',
    database: 'LucideDatabase',
    notification: 'LucideBell',
    transform: 'LucideWand2',
    code: 'LucideCode',
    filter: 'LucideFilter',
    condition: 'LucideGitBranch',
    loop: 'LucideRepeat',
    delay: 'LucideTimer',
  };
  return icons[icon] || 'LucideCircle';
};

// Get node type color class
const getNodeTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    trigger: 'bg-[hsl(142_76%_36%)]',
    action: 'bg-[hsl(217_91%_60%)]',
    condition: 'bg-[hsl(48_96%_53%)]',
    loop: 'bg-[hsl(280_67%_60%)]',
    delay: 'bg-[hsl(25_95%_53%)]',
  };
  return colors[type] || colors.action;
};

// Format timestamp
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

// Status color
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    success: 'bg-[hsl(142_76%_36%)]',
    failed: 'bg-destructive',
    running: 'bg-[hsl(217_91%_60%)]',
  };
  return colors[status] || 'bg-muted';
};
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Top Toolbar -->
    <div class="bg-card flex items-center justify-between border-b px-4 py-2">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" @click="router.push('/workflows/list')">
          <LucideArrowLeft class="size-4" />
        </Button>
        <div class="flex flex-col">
          <input
            v-model="workflowName"
            class="bg-transparent text-lg font-semibold focus:outline-none"
            placeholder="Workflow name"
          />
          <span class="text-muted-foreground text-xs">
            ID: {{ isNew ? 'New' : workflowId }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="isNodePaletteOpen = true">
          <LucidePlus class="mr-2 size-4" />
          Add Node
        </Button>
        <Button variant="outline" :loading="isSaving" @click="saveWorkflow">
          <LucideSave class="mr-2 size-4" />
          Save
        </Button>
        <Button :loading="isRunning" @click="runWorkflow">
          <LucidePlay class="mr-2 size-4" />
          Run
        </Button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Main Canvas -->
      <div
        class="flex-1 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <VueFlow
          :nodes="initialNodes"
          :edges="initialEdges"
          :node-types="nodeTypes"
          :default-viewport="{ zoom: 1, x: 0, y: 0 }"
          :min-zoom="0.2"
          :max-zoom="4"
          fit-view-on-init
          class="workflow-canvas"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
        >
          <Background pattern-color="#e5e5e5" :gap="20" />
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            :node-color="getNodeColor"
            :node-stroke-width="0"
            :mask-color="'rgba(0, 0, 0, 0.1)'"
          />
        </VueFlow>
      </div>

      <!-- Right Sidebar -->
      <div class="bg-card w-80 shrink-0 border-l">
        <Tabs v-model="activeTab" class="flex h-full flex-col">
          <TabsList class="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" class="flex-1 overflow-y-auto p-4">
            <div v-if="selectedNode" class="space-y-4">
              <!-- Node type badge -->
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'flex size-8 items-center justify-center rounded-md',
                    getNodeTypeColor(selectedNode.type || 'action'),
                  ]"
                >
                  <component
                    :is="getTemplateIcon(selectedNode.data.icon)"
                    class="size-4 text-white"
                  />
                </div>
                <Badge variant="secondary" class="capitalize">
                  {{ selectedNode.type }}
                </Badge>
              </div>

              <!-- Label -->
              <div class="space-y-2">
                <Label>Label</Label>
                <Input
                  :model-value="selectedNode.data.label"
                  @update:model-value="updateNodeLabel($event)"
                />
              </div>

              <!-- Description -->
              <div class="space-y-2">
                <Label>Description</Label>
                <Input
                  :model-value="selectedNode.data.description"
                  @update:model-value="updateNodeDescription($event)"
                />
              </div>

              <Separator />

              <!-- Node-specific configuration -->
              <div class="space-y-4">
                <h4 class="text-sm font-medium">Configuration</h4>

                <!-- Trigger config -->
                <template v-if="selectedNode.type === 'trigger'">
                  <div class="space-y-2">
                    <Label>Webhook Path</Label>
                    <Input
                      :model-value="selectedNode.data.config?.path || ''"
                      placeholder="/api/webhook"
                      @update:model-value="updateNodeConfig('path', $event)"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>HTTP Method</Label>
                    <Select
                      :model-value="selectedNode.data.config?.method || 'POST'"
                      @update:model-value="updateNodeConfig('method', $event)"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </template>

                <!-- Condition config -->
                <template v-else-if="selectedNode.type === 'condition'">
                  <div class="space-y-2">
                    <Label>Field</Label>
                    <Input
                      :model-value="selectedNode.data.config?.field || ''"
                      placeholder="data.status"
                      @update:model-value="updateNodeConfig('field', $event)"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      :model-value="
                        selectedNode.data.config?.operator || 'equals'
                      "
                      @update:model-value="updateNodeConfig('operator', $event)"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">
                          Greater Than
                        </SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="is_empty">Is Empty</SelectItem>
                        <SelectItem value="is_not_empty">
                          Is Not Empty
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label>Value</Label>
                    <Input
                      :model-value="selectedNode.data.config?.value || ''"
                      placeholder="active"
                      @update:model-value="updateNodeConfig('value', $event)"
                    />
                  </div>
                </template>

                <!-- Loop config -->
                <template v-else-if="selectedNode.type === 'loop'">
                  <div class="space-y-2">
                    <Label>Items Field</Label>
                    <Input
                      :model-value="selectedNode.data.config?.itemsField || ''"
                      placeholder="data.items"
                      @update:model-value="
                        updateNodeConfig('itemsField', $event)
                      "
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Batch Size</Label>
                    <Input
                      type="number"
                      :model-value="selectedNode.data.config?.batchSize || 1"
                      min="1"
                      @update:model-value="
                        updateNodeConfig('batchSize', parseInt($event))
                      "
                    />
                  </div>
                </template>

                <!-- Delay config -->
                <template v-else-if="selectedNode.type === 'delay'">
                  <div class="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      type="number"
                      :model-value="selectedNode.data.config?.duration || 5"
                      min="1"
                      @update:model-value="
                        updateNodeConfig('duration', parseInt($event))
                      "
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      :model-value="
                        selectedNode.data.config?.unit || 'seconds'
                      "
                      @update:model-value="updateNodeConfig('unit', $event)"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </template>

                <!-- Action config (HTTP) -->
                <template v-else-if="selectedNode.type === 'action'">
                  <div class="space-y-2">
                    <Label>URL</Label>
                    <Input
                      :model-value="selectedNode.data.config?.url || ''"
                      placeholder="https://api.example.com"
                      @update:model-value="updateNodeConfig('url', $event)"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Method</Label>
                    <Select
                      :model-value="selectedNode.data.config?.method || 'GET'"
                      @update:model-value="updateNodeConfig('method', $event)"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      :model-value="selectedNode.data.config?.headers || ''"
                      placeholder='{"Content-Type": "application/json"}'
                      class="font-mono text-xs"
                      rows="3"
                      @update:model-value="updateNodeConfig('headers', $event)"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Body (JSON)</Label>
                    <Textarea
                      :model-value="selectedNode.data.config?.body || ''"
                      placeholder='{"key": "value"}'
                      class="font-mono text-xs"
                      rows="3"
                      @update:model-value="updateNodeConfig('body', $event)"
                    />
                  </div>
                </template>
              </div>

              <Separator />

              <!-- Delete button -->
              <Button
                variant="destructive"
                class="w-full"
                @click="deleteSelectedNode"
              >
                <LucideTrash2 class="mr-2 size-4" />
                Delete Node
              </Button>
            </div>

            <!-- Empty state -->
            <div v-else class="text-muted-foreground py-8 text-center text-sm">
              <LucideMousePointer2 class="mx-auto mb-2 size-8 opacity-50" />
              Click on a node to view and edit its properties
            </div>
          </TabsContent>

          <TabsContent value="executions" class="flex-1 overflow-y-auto">
            <div class="divide-y">
              <div
                v-for="execution in executions"
                :key="execution.id"
                class="hover:bg-muted/50 cursor-pointer p-4 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <div
                    :class="['mt-1 size-2 shrink-0 rounded-full', getStatusColor(execution.status)]"
                  />
                  <div class="flex-1 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium capitalize">
                        {{ execution.status }}
                      </span>
                      <span class="text-muted-foreground text-xs">
                        {{ formatTime(execution.startedAt) }}
                      </span>
                    </div>
                    <div
                      class="text-muted-foreground flex items-center gap-2 text-xs"
                    >
                      <span>{{ execution.trigger }}</span>
                      <span>•</span>
                      <span>{{ execution.duration }}</span>
                    </div>
                    <p
                      v-if="execution.error"
                      class="text-destructive text-xs"
                    >
                      {{ execution.error }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    <!-- Node Palette Sheet -->
    <Sheet v-model:open="isNodePaletteOpen">
      <SheetContent side="left" class="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Node</SheetTitle>
          <SheetDescription>
            Drag a node to the canvas or click to add at center
          </SheetDescription>
        </SheetHeader>

        <div class="mt-4 space-y-4">
          <!-- Search -->
          <div class="relative">
            <LucideSearch
              class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search nodes..."
              class="pl-9"
            />
          </div>

          <!-- Categories -->
          <div v-if="filteredTemplates.length > 0" class="space-y-6">
            <div
              v-for="category in filteredTemplates"
              :key="category.category"
              class="space-y-2"
            >
              <div class="flex items-center gap-2">
                <component
                  :is="getCategoryIcon(category.category)"
                  class="text-muted-foreground size-4"
                />
                <h3 class="text-muted-foreground text-sm font-medium">
                  {{ category.category }}
                </h3>
              </div>

              <div class="space-y-1">
                <div
                  v-for="template in category.items"
                  :key="template.id"
                  draggable="true"
                  class="hover:bg-muted group flex cursor-move items-center gap-3 rounded-lg border p-3 transition-colors"
                  @dragstart="onDragStart($event, template, category.type)"
                  @click="quickAddNode(template, category.type)"
                >
                  <div
                    :class="[
                      'flex size-8 shrink-0 items-center justify-center rounded-md',
                      getNodeTypeColor(category.type),
                    ]"
                  >
                    <component
                      :is="getTemplateIcon(template.id)"
                      class="size-4 text-white"
                    />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium">{{ template.label }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ template.description }}
                    </p>
                  </div>
                  <LucideGripVertical
                    class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty search state -->
          <div v-else class="text-muted-foreground py-8 text-center text-sm">
            <LucideSearch class="mx-auto mb-2 size-8 opacity-50" />
            No nodes found for "{{ searchQuery }}"
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style>
/* VueFlow dark mode overrides */
.dark .workflow-canvas .vue-flow__edge-path {
  stroke: hsl(240 3.7% 45%);
}

.dark .workflow-canvas .vue-flow__edge-path:hover {
  stroke: hsl(240 3.7% 60%);
}

.dark .workflow-canvas .vue-flow__controls {
  background: hsl(240 10% 3.9%);
  border-color: hsl(240 3.7% 15.9%);
}

.dark .workflow-canvas .vue-flow__controls-button {
  background: hsl(240 10% 3.9%);
  border-color: hsl(240 3.7% 15.9%);
  fill: hsl(0 0% 100%);
}

.dark .workflow-canvas .vue-flow__controls-button:hover {
  background: hsl(240 3.7% 15.9%);
}

.dark .workflow-canvas .vue-flow__minimap {
  background: hsl(240 10% 3.9%);
}

.dark .workflow-canvas .vue-flow__background pattern {
  stroke: hsl(240 3.7% 15.9%);
}

/* Light mode background pattern */
.workflow-canvas .vue-flow__background pattern {
  stroke: #e5e5e5;
}
</style>
