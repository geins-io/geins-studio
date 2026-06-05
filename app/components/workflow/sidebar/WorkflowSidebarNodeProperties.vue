<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core';
import type { WorkflowInput, WorkflowVariable } from '#shared/types';
import type { ExpressionCompletion } from '@/components/workflow/shared/ExpressionInput.vue';
import type { ManifestAction } from '@/composables/useWorkflowManifest';
import NodePaneInput from './NodePaneInput.vue';
import NodePaneOutput from './NodePaneOutput.vue';
import NodePaneSettings from './NodePaneSettings.vue';
import type { Ref } from 'vue';

type NodeExecution = {
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  status?: string;
} | null;

const props = defineProps<{
  node: Record<string, unknown> | null;
  nodeExecution?: NodeExecution;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isOpen = computed(() => props.node !== null);

const manifestStore = useWorkflowManifest();
const { resolveIcon } = useLucideIcon();
const { nodes: vfNodes, edges: vfEdges } = useVueFlow();

const workflowInputDefs = inject<Ref<WorkflowInput[]>>(
  'workflowInputDefs',
  ref([]),
);
const workflowVariables = inject<Ref<WorkflowVariable[]>>(
  'workflowVariables',
  ref([]),
);

type NodeExecData = {
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  status?: string;
};
const lastNodeExecutions =
  inject<Ref<Map<string, NodeExecData>>>('lastNodeExecutions');

function addObjectKeyCompletions(
  items: ExpressionCompletion[],
  obj: unknown,
  pathPrefix: string,
  section: string,
  maxDepth = 3,
  depth = 0,
) {
  if (depth >= maxDepth || obj === null || obj === undefined) return;

  if (Array.isArray(obj)) {
    items.push({
      expression: `{{${pathPrefix}[0]}}`,
      label: `${pathPrefix.slice(pathPrefix.lastIndexOf('.') + 1)}[0]`,
      detail: `first of ${obj.length} items`,
      section,
    });
    if (obj.length > 0) {
      addObjectKeyCompletions(
        items,
        obj[0],
        `${pathPrefix}[0]`,
        section,
        maxDepth,
        depth + 1,
      );
    }
    return;
  }

  if (typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = `${pathPrefix}.${k}`;
    const preview =
      v === null
        ? 'null'
        : typeof v === 'object'
          ? Array.isArray(v)
            ? `[${v.length}]`
            : `{${Object.keys(v).length}}`
          : String(v);
    items.push({
      expression: `{{${fullPath}}}`,
      label: `${pathPrefix.slice(pathPrefix.lastIndexOf('.') + 1)}.${k}`,
      detail: preview.length > 40 ? preview.slice(0, 40) + '…' : preview,
      section,
    });
    addObjectKeyCompletions(items, v, fullPath, section, maxDepth, depth + 1);
  }
}

function inferTransformValueType(v: unknown): string {
  if (v === null || v === undefined) return 'string';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'object') return 'object';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  const s = String(v);
  if (s.startsWith('{') || s.startsWith('[')) return 'json';
  return 'string';
}

const expressionCompletions = computed<ExpressionCompletion[]>(() => {
  const nodeId = props.node?.id as string | undefined;
  if (!nodeId) return [];

  const items: ExpressionCompletion[] = [];

  const ITERATOR_CONTEXT_VARS: Array<{ name: string; type: string }> = [
    { name: '$current', type: 'any' },
    { name: '$index', type: 'number' },
  ];

  const PAGINATOR_CONTEXT_VARS: Array<{ name: string; type: string }> = [
    { name: '$cursor', type: 'any' },
    { name: '$pageNumber', type: 'number' },
    { name: '$pageSize', type: 'number' },
  ];

  const incomingEdges = vfEdges.value.filter((e) => e.target === nodeId);
  for (const edge of incomingEdges) {
    const n = vfNodes.value.find((nd) => nd.id === edge.source);
    if (!n) continue;
    const data = (n.data ?? {}) as Record<string, unknown>;
    const action = manifestStore.getAction(
      data.actionName as string | undefined,
    );
    const label = (data.label as string) || action?.displayName || n.id;
    const section = `output · ${label}`;
    const exec = lastNodeExecutions?.value?.get(edge.source);
    const nodeType = n.type as string;

    const actionName = data.actionName as string | undefined;
    let outputFields: Array<{ name: string; type: string }>;
    if (
      (nodeType === 'iterator' || nodeType === 'loop') &&
      edge.sourceHandle === 'foreach'
    ) {
      outputFields = ITERATOR_CONTEXT_VARS;
    } else if (
      nodeType === 'paginator' &&
      (edge.sourceHandle === 'fetchPage' || edge.sourceHandle === 'forEachPage')
    ) {
      outputFields = PAGINATOR_CONTEXT_VARS;
    } else if (
      actionName === 'transform.map' ||
      actionName === 'transform.compose'
    ) {
      const input = (data.input ?? {}) as Record<string, unknown>;
      outputFields = Object.keys(input)
        .filter((k) => k && !k.startsWith('_'))
        .map((k) => ({ name: k, type: inferTransformValueType(input[k]) }));
    } else {
      const nodeTypeDef = manifestStore.getNodeType(nodeType);
      outputFields = (action?.output ?? nodeTypeDef?.output ?? []) as Array<{
        name: string;
        type: string;
      }>;
    }

    for (const field of outputFields) {
      const isContextVar = field.name.startsWith('$');
      items.push({
        expression: isContextVar
          ? `{{${field.name}}}`
          : `{{output.${edge.source}.${field.name}}}`,
        label: field.name,
        detail: `${label} · ${field.type}`,
        section,
      });
      if (!isContextVar && exec?.output) {
        const val = exec.output[field.name];
        addObjectKeyCompletions(
          items,
          val,
          `output.${edge.source}.${field.name}`,
          section,
        );
      }
    }
  }

  for (const inp of workflowInputDefs.value) {
    items.push({
      expression: `{{input.${inp.name}}}`,
      label: inp.name,
      detail: inp.type,
      section: 'input',
    });
  }

  for (const v of workflowVariables.value) {
    items.push({
      expression: `{{vars.${v.key}}}`,
      label: v.key,
      detail: v.isSecret ? 'secret' : (v.value ?? ''),
      section: 'vars',
    });
  }

  for (const fn of manifestStore.expressionFunctions.value) {
    const params = (fn.parameters ?? []).map((p) => p.name).join(', ');
    items.push({
      expression: `${fn.name}(`,
      label: `${fn.name}(${params})`,
      detail: `→ ${fn.returnType ?? '?'}  ${fn.description ?? ''}`,
      section: `ƒ ${fn.category ?? 'Functions'}`,
      type: 'function',
    });
  }

  return items;
});

provide('expressionCompletions', expressionCompletions);
provide('expressionFunctions', manifestStore.expressionFunctions);

function drillPath(obj: Record<string, unknown>, segments: string[]): unknown {
  let current: unknown = obj;
  for (const seg of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    )
      return undefined;
    const bracketMatch = seg.match(/^(.+?)\[(\d+)\]$/);
    if (bracketMatch && bracketMatch[1] && bracketMatch[2]) {
      current = (current as Record<string, unknown>)[bracketMatch[1]];
      if (!Array.isArray(current)) return undefined;
      current = (current as unknown[])[Number(bracketMatch[2])];
    } else {
      current = (current as Record<string, unknown>)[seg];
    }
  }
  return current;
}

function resolveExpression(expr: string): string | null {
  const strLiteral =
    expr.match(/^\{\{\s*'([^']*)'\s*\}\}$/) ||
    expr.match(/^\{\{\s*"([^"]*)"\s*\}\}$/);
  if (strLiteral && strLiteral[1] !== undefined) return strLiteral[1];

  const match = expr.match(/^\{\{(\w+)\.(.+)\}\}$/);
  if (!match) return null;
  const ns = match[1];
  const path = match[2];
  if (!ns || !path) return null;

  if (ns === 'output') {
    const nodeId = props.node?.id as string | undefined;
    if (!nodeId) return null;
    const sourceIds = vfEdges.value
      .filter((e) => e.target === nodeId)
      .map((e) => e.source);
    for (const srcId of sourceIds) {
      if (!path.startsWith(srcId + '.')) continue;
      const fieldPath = path.slice(srcId.length + 1);
      const exec = lastNodeExecutions?.value?.get(srcId);
      if (!exec?.output) return null;
      const segments = fieldPath.split('.');
      const val = drillPath(exec.output, segments);
      if (val === undefined) return null;
      if (val === null) return 'null';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    }
    return null;
  }

  if (ns === 'input') {
    const exec = lastNodeExecutions?.value?.get(props.node?.id as string);
    if (!exec?.input) return null;
    const val = exec.input[path];
    if (val === undefined) return null;
    if (val === null) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  if (ns === 'vars') {
    const v = workflowVariables.value.find((vr) => vr.key === path);
    if (!v) return null;
    if (v.isSecret) return '••••••';
    return v.value ?? null;
  }

  return null;
}

provide('resolveExpression', resolveExpression);

const nodeData = computed(
  () => (props.node?.data ?? {}) as Record<string, unknown>,
);
const nodeType = computed(() => (props.node?.type ?? '') as string);
const selectedNodeId = computed(() => (props.node?.id ?? '') as string);
provide('selectedNodeId', selectedNodeId);
const isTriggerNode = computed(() => nodeType.value === 'trigger');

const manifestNodeType = computed(() =>
  manifestStore.getNodeType(nodeType.value),
);
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (nodeType.value !== 'action') return undefined;
  return manifestStore.getAction(
    nodeData.value.actionName as string | undefined,
  );
});

const nodeIcon = computed(() => {
  const iconName =
    (nodeData.value.icon as string | undefined) ??
    manifestNodeType.value?.icon ??
    manifestAction.value?.icon;
  return resolveIcon(iconName);
});

const nodeLabel = computed(
  () =>
    (nodeData.value.label as string) ||
    manifestNodeType.value?.displayName ||
    'Node properties',
);

const isEditingLabel = ref(false);
const editLabelText = ref('');
const labelInput = ref<HTMLInputElement>();
const labelMeasure = ref<HTMLSpanElement>();

const labelWidth = computed(() => {
  const text = isEditingLabel.value ? editLabelText.value : nodeLabel.value;
  return text || 'Node';
});

const startEditLabel = () => {
  editLabelText.value = nodeLabel.value;
  isEditingLabel.value = true;
  nextTick(() => {
    labelInput.value?.focus();
    labelInput.value?.select();
  });
};

const commitLabel = () => {
  const trimmed = editLabelText.value.trim();
  if (trimmed && trimmed !== nodeLabel.value) {
    nodeData.value.label = trimmed;
  }
  isEditingLabel.value = false;
};

const cancelEditLabel = () => {
  isEditingLabel.value = false;
};
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header — full width, icon + name left, actions right -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <component :is="nodeIcon" v-if="nodeIcon" class="h-4 w-4 shrink-0" />
        <LucideSettings v-else class="h-4 w-4 shrink-0" />
        <div
          class="group relative inline-grid min-w-0 items-center text-sm font-medium"
        >
          <span
            ref="labelMeasure"
            class="invisible col-start-1 row-start-1 px-1 whitespace-pre"
          >
            {{ labelWidth }}
          </span>
          <input
            v-if="isEditingLabel"
            ref="labelInput"
            v-model="editLabelText"
            class="ring-primary col-start-1 row-start-1 min-w-0 rounded bg-transparent px-1 text-sm font-medium ring-1 outline-none"
            @blur="commitLabel"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            @keydown.escape.prevent="cancelEditLabel"
          />
          <span
            v-else
            class="group-hover:ring-border col-start-1 row-start-1 cursor-text truncate rounded px-1 group-hover:ring-1"
            @click="startEditLabel"
          >
            {{ nodeLabel }}
          </span>
        </div>
        <span
          v-if="!isTriggerNode && node?.id"
          class="bg-muted text-muted-foreground ml-1 shrink-0 rounded px-1 py-0.5 font-mono text-[9px]"
        >
          {{ node.id }}
        </span>
        <span
          v-if="nodeExecution?.status"
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
          :class="{
            'bg-green-500/10 text-green-600 dark:text-green-400':
              nodeExecution.status === 'completed' ||
              nodeExecution.status === 'succeeded',
            'bg-red-500/10 text-red-600 dark:text-red-400':
              nodeExecution.status === 'failed',
            'bg-blue-500/10 text-blue-600 dark:text-blue-400':
              nodeExecution.status === 'running',
            'bg-muted text-muted-foreground': ![
              'completed',
              'succeeded',
              'failed',
              'running',
            ].includes(nodeExecution.status ?? ''),
          }"
        >
          {{ nodeExecution.status }}
        </span>
      </div>
      <button
        class="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-1.5 transition-colors"
        title="Close"
        @click="emit('close')"
      >
        <LucideX class="h-4 w-4" />
      </button>
    </div>

    <!-- 3-column body (trigger nodes show only center) -->
    <div v-if="node" class="flex min-h-0 flex-1">
      <NodePaneInput
        v-if="!isTriggerNode"
        :node-id="node.id as string"
        :node-execution="nodeExecution"
      />
      <NodePaneSettings :node-type="nodeType" :node-data="nodeData" />
      <NodePaneOutput v-if="!isTriggerNode" :node-execution="nodeExecution" />
    </div>
  </div>
</template>
