<script setup lang="ts">
import type {
  WorkflowSummary,
  WorkflowInput,
  WorkflowDefinition,
} from '#shared/types';
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';
import WorkflowDataType from '@/components/workflow/shared/WorkflowDataType.vue';

const props = defineProps<{
  nodeData: Record<string, unknown>;
  nodeConfig: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  updateConfig: (name: string, value: unknown) => void;
  updateInput: (name: string, value: unknown) => void;
}>();

const route = useRoute();
const { orchestratorApi } = useGeinsRepository();

// Migrate legacy data: old code stored workflowId/workflowName in config instead of input
onMounted(() => {
  for (const key of ['workflowId', 'workflowName'] as const) {
    if (!props.nodeInput[key] && props.nodeConfig[key]) {
      props.updateInput(key, props.nodeConfig[key]);
    }
  }
});

// ─── Workflow selector ───────────────────────────────────────────
const currentWorkflowId = computed(() => route.params.id as string);

const { data: allWorkflows } = await useAsyncData<WorkflowSummary[]>(
  'workflows-list-for-selector',
  () => orchestratorApi.workflow.list(),
  { default: () => [] },
);

const onDemandWorkflows = computed(() => {
  const list = Array.isArray(allWorkflows.value) ? allWorkflows.value : [];
  return list.filter(
    (wf) =>
      wf.enabled &&
      wf.type?.toLowerCase() === 'ondemand' &&
      wf.id !== currentWorkflowId.value,
  );
});

// ─── Fetch input definitions for on-demand workflows ─────────────
const workflowInputDefs = ref<Map<string, WorkflowInput[]>>(new Map());

const fetchWorkflowInputs = async () => {
  const ids = onDemandWorkflows.value.map((wf) => wf.id);
  const results = await Promise.allSettled(
    ids.map((id) => orchestratorApi.workflow.get(id)),
  );
  const map = new Map<string, WorkflowInput[]>();
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      const def = result.value as WorkflowDefinition;
      const id = ids[i];
      if (id && def.input?.length) map.set(id, def.input);
    }
  });
  workflowInputDefs.value = map;
};

watch(
  onDemandWorkflows,
  () => {
    fetchWorkflowInputs();
  },
  { immediate: true },
);

const getWorkflowInputs = (id: string): WorkflowInput[] =>
  workflowInputDefs.value.get(id) ?? [];

const selectedWorkflowInputs = computed(() => {
  const id = props.nodeInput.workflowId as string | undefined;
  if (!id) return [];
  return getWorkflowInputs(id);
});

// ─── Popover state ───────────────────────────────────────────────
const selectorOpen = ref(false);
const selectorSearch = ref('');

const filteredWorkflows = computed(() => {
  const q = selectorSearch.value.toLowerCase().trim();
  if (!q) return onDemandWorkflows.value;
  return onDemandWorkflows.value.filter(
    (wf) =>
      wf.name.toLowerCase().includes(q) ||
      wf.id.toLowerCase().includes(q) ||
      wf.description?.toLowerCase().includes(q),
  );
});

const selectedWorkflowName = computed(() => {
  const id = props.nodeInput.workflowId as string | undefined;
  if (!id) return '';
  const wf = onDemandWorkflows.value.find((w) => w.id === id);
  return wf?.name ?? '';
});

function selectWorkflow(wf: WorkflowSummary) {
  props.updateInput('workflowId', wf.id);
  props.updateInput('workflowName', wf.name);
  selectorOpen.value = false;
  selectorSearch.value = '';
  removedOptionalKeys.value.clear();

  const expectedInputs = getWorkflowInputs(wf.id);
  if (expectedInputs.length) {
    const existing = (props.nodeInput.input ?? {}) as Record<string, unknown>;
    const merged: Record<string, string> = {};
    for (const inp of expectedInputs) {
      merged[inp.name] = String(existing[inp.name] ?? inp.defaultValue ?? '');
    }
    props.updateInput('input', merged);
  } else {
    props.updateInput('input', undefined);
  }
}

function clearWorkflow() {
  props.updateInput('workflowId', '');
  props.updateInput('workflowName', '');
}

// ─── Input parameters (driven by selected workflow's declared inputs) ─
const inputRaw = computed(
  () => (props.nodeInput.input ?? {}) as Record<string, unknown>,
);

const removedOptionalKeys = ref<Set<string>>(new Set());

const activeInputParams = computed(() => {
  return selectedWorkflowInputs.value.filter(
    (inp) => inp.required || !removedOptionalKeys.value.has(inp.name),
  );
});

function getInputValue(name: string): string {
  const val = inputRaw.value[name];
  if (val == null) return '';
  return String(val);
}

function setInputValue(name: string, value: string) {
  const current = { ...inputRaw.value };
  current[name] = value;
  props.updateInput('input', current);
}

function removeOptionalParam(name: string) {
  removedOptionalKeys.value.add(name);
  const current = Object.fromEntries(
    Object.entries(inputRaw.value).filter(([k]) => k !== name),
  );
  props.updateInput(
    'input',
    Object.keys(current).length > 0 ? current : undefined,
  );
}

function restoreParam(name: string) {
  removedOptionalKeys.value.delete(name);
  const current = { ...inputRaw.value };
  const def = selectedWorkflowInputs.value.find((i) => i.name === name);
  current[name] = def?.defaultValue ?? '';
  props.updateInput('input', current);
}

const removedParams = computed(() => {
  return selectedWorkflowInputs.value.filter(
    (inp) => !inp.required && removedOptionalKeys.value.has(inp.name),
  );
});

watch(selectedWorkflowInputs, () => {
  removedOptionalKeys.value.clear();
});

const isNumericType = (type: string) =>
  ['number', 'integer', 'int'].includes(type.toLowerCase());

function paramError(inp: WorkflowInput): string | null {
  const val = getInputValue(inp.name);
  if (!val) return null;
  if (val.includes('{{')) return null;
  if (isNumericType(inp.type) && isNaN(Number(val))) return 'Must be a number';
  return null;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Workflow selector -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Workflow
        <span class="text-destructive">*</span>
      </label>
      <p class="text-muted-foreground text-xs">
        Select an active on-demand workflow to execute
      </p>

      <Popover v-model:open="selectorOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="bg-background hover:bg-muted flex h-9 w-full items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors"
          >
            <LucideWorkflow class="text-muted-foreground h-4 w-4 shrink-0" />
            <span v-if="nodeInput.workflowId" class="min-w-0 flex-1 truncate">
              {{ selectedWorkflowName || nodeInput.workflowId }}
            </span>
            <span v-else class="text-muted-foreground min-w-0 flex-1 truncate">
              Select workflow…
            </span>
            <button
              v-if="nodeInput.workflowId"
              type="button"
              class="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5"
              @click.stop="clearWorkflow"
            >
              <LucideX class="h-3 w-3" />
            </button>
            <LucideChevronsUpDown
              class="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-50"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          class="p-0"
          align="start"
          :style="{ width: 'var(--reka-popover-trigger-width)' }"
        >
          <div class="border-b p-2">
            <div class="relative">
              <LucideSearch
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2"
              />
              <input
                v-model="selectorSearch"
                type="text"
                placeholder="Search workflows…"
                class="bg-muted focus:ring-ring w-full rounded-md py-1.5 pr-2 pl-7 text-xs focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
          <div class="max-h-72 overflow-y-auto p-1">
            <template v-if="filteredWorkflows.length">
              <button
                v-for="wf in filteredWorkflows"
                :key="wf.id"
                type="button"
                class="hover:bg-accent flex w-full flex-col rounded-sm px-2 py-2 text-left text-xs transition-colors"
                :class="nodeInput.workflowId === wf.id ? 'bg-accent' : ''"
                @click="selectWorkflow(wf)"
              >
                <div class="flex w-full items-center gap-2">
                  <LucideCheck
                    v-if="nodeInput.workflowId === wf.id"
                    class="h-3 w-3 shrink-0 text-green-500"
                  />
                  <LucideWorkflow
                    v-else
                    class="text-muted-foreground h-3 w-3 shrink-0"
                  />
                  <span class="min-w-0 flex-1 truncate font-medium">
                    {{ wf.name }}
                  </span>
                  <span
                    v-if="wf.group"
                    class="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                  >
                    {{ wf.group }}
                  </span>
                </div>
                <span
                  v-if="wf.description"
                  class="text-muted-foreground mt-0.5 pl-5 text-[10px]"
                >
                  {{ wf.description }}
                </span>
                <!-- Input parameters info -->
                <div
                  v-if="getWorkflowInputs(wf.id).length"
                  class="mt-1 flex flex-wrap gap-1 pl-5"
                >
                  <span
                    v-for="inp in getWorkflowInputs(wf.id).slice(0, 5)"
                    :key="inp.name"
                    class="bg-primary/10 text-primary inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]"
                  >
                    {{ inp.name }}
                    <span class="opacity-50">{{ inp.type }}</span>
                    <span v-if="inp.required" class="text-destructive">*</span>
                  </span>
                  <span
                    v-if="getWorkflowInputs(wf.id).length > 5"
                    class="text-muted-foreground inline-flex items-center px-1 text-[10px]"
                  >
                    +{{ getWorkflowInputs(wf.id).length - 5 }} more
                  </span>
                </div>
                <span
                  class="text-muted-foreground mt-0.5 pl-5 font-mono text-[10px]"
                >
                  {{ wf.id }}
                </span>
              </button>
            </template>
            <div
              v-else
              class="text-muted-foreground px-2 py-4 text-center text-xs"
            >
              <p>No matching workflows</p>
              <p class="mt-1 opacity-60">
                Only active on-demand workflows are shown
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- Show selected ID for reference -->
      <div
        v-if="nodeInput.workflowId"
        class="text-muted-foreground flex items-center gap-1 px-0.5 font-mono text-[10px]"
      >
        <span class="opacity-50">ID:</span>
        <span class="truncate">{{ nodeInput.workflowId }}</span>
      </div>
    </div>

    <!-- Input parameters (driven by selected workflow's declared inputs) -->
    <div v-if="selectedWorkflowInputs.length" class="space-y-3">
      <div>
        <label class="text-sm font-medium">Input parameters</label>
        <p class="text-muted-foreground text-xs">
          Values passed to the child workflow
        </p>
      </div>

      <div class="space-y-3">
        <div v-for="inp in activeInputParams" :key="inp.name" class="space-y-1">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-medium">{{ inp.name }}</span>
            <WorkflowDataType :type="inp.type" display="long" />
            <span
              v-if="inp.required"
              class="text-destructive text-[10px] font-medium"
            >
              required
            </span>
            <TooltipProvider v-if="inp.description" :delay-duration="200">
              <Tooltip>
                <TooltipTrigger as-child>
                  <LucideInfo
                    class="text-muted-foreground h-3 w-3 shrink-0 cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="4">
                  {{ inp.description }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div class="flex items-center gap-1">
            <div class="min-w-0 flex-1">
              <ExpressionInput
                :model-value="getInputValue(inp.name)"
                :placeholder="
                  inp.defaultValue != null ? String(inp.defaultValue) : inp.name
                "
                size="sm"
                :default-mode="
                  getInputValue(inp.name).includes('{{')
                    ? 'expression'
                    : 'fixed'
                "
                @update:model-value="setInputValue(inp.name, $event)"
              />
            </div>
            <button
              v-if="!inp.required"
              class="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors"
              title="Remove parameter"
              @click="removeOptionalParam(inp.name)"
            >
              <LucideX class="h-3 w-3" />
            </button>
            <div v-else class="w-5 shrink-0" />
          </div>
          <p v-if="paramError(inp)" class="text-destructive text-[11px]">
            {{ paramError(inp) }}
          </p>
        </div>
      </div>

      <!-- Removed optional params (restore) -->
      <div v-if="removedParams.length" class="border-t pt-2">
        <p
          class="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase"
        >
          Removed
        </p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="inp in removedParams"
            :key="inp.name"
            type="button"
            class="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] transition-colors"
            @click="restoreParam(inp.name)"
          >
            <LucidePlus class="h-2.5 w-2.5" />
            {{ inp.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Behaviour options -->
    <div class="border-t pt-4">
      <label class="mb-2 block text-sm font-medium">Behaviour</label>
      <div class="space-y-3">
        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.waitForCompletion ?? true)"
            class="mt-0.5 rounded border"
            @change="
              updateConfig(
                'waitForCompletion',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <div>
            <label class="text-sm">Wait for completion</label>
            <p class="text-muted-foreground text-xs">
              Wait for child workflow to finish before continuing
            </p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.cascadeCancellation ?? true)"
            class="mt-0.5 rounded border"
            @change="
              updateConfig(
                'cascadeCancellation',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <div>
            <label class="text-sm">Cascade cancellation</label>
            <p class="text-muted-foreground text-xs">
              Cancel child workflow if parent is cancelled
            </p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.inheritVariables ?? false)"
            class="mt-0.5 rounded border"
            @change="
              updateConfig(
                'inheritVariables',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <div>
            <label class="text-sm">Inherit variables</label>
            <p class="text-muted-foreground text-xs">
              Pass parent workflow variables to child
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
