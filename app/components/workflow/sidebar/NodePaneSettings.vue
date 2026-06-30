<script setup lang="ts">
import type { ManifestConfigProperty, ManifestNode } from '#shared/types';
import NodeSettingsAction from './settings/NodeSettingsAction.vue';
import NodeSettingsCondition from './settings/NodeSettingsCondition.vue';
import NodeSettingsDelay from './settings/NodeSettingsDelay.vue';
import NodeSettingsExecution from './settings/NodeSettingsExecution.vue';
import NodeSettingsInputSchema from './settings/NodeSettingsInputSchema.vue';
import NodeSettingsIterator from './settings/NodeSettingsIterator.vue';
import NodeSettingsPaginator from './settings/NodeSettingsPaginator.vue';
import NodeSettingsTrigger from './settings/NodeSettingsTrigger.vue';
import NodeSettingsWorkflow from './settings/NodeSettingsWorkflow.vue';
import type { Component } from 'vue';

const SETTINGS_COMPONENTS: Record<string, Component> = {
  trigger: NodeSettingsTrigger,
  action: NodeSettingsAction,
  condition: NodeSettingsCondition,
  iterator: NodeSettingsIterator,
  loop: NodeSettingsIterator,
  delay: NodeSettingsDelay,
  workflow: NodeSettingsWorkflow,
  paginator: NodeSettingsPaginator,
};

const props = defineProps<{
  nodeType: string;
  nodeData: Record<string, unknown>;
}>();

const manifestStore = useWorkflowManifest();

const manifestNode = computed<ManifestNode | undefined>(() =>
  manifestStore.getNode(props.nodeData.functionName as string | undefined),
);

const nodeConfigFields = computed<ManifestConfigProperty[]>(
  () => manifestNode.value?.config ?? [],
);

const nodeConfig = computed(
  () => (props.nodeData.config ?? {}) as Record<string, unknown>,
);
// Inputs are now part of `config` (schemaVersion 3.x). `nodeInput`/`updateInput`
// remain as aliases so the per-kind settings panels keep their existing API.
const nodeInput = nodeConfig;
const nodeUi = computed(
  () => (props.nodeData.ui ?? {}) as Record<string, unknown>,
);
const nodeEditorHints = computed(
  () => (nodeUi.value.editor ?? {}) as Record<string, unknown>,
);

const settingsComponent = computed(() => SETTINGS_COMPONENTS[props.nodeType]);

const onNodeSettingsChange = inject<() => void>(
  'onNodeSettingsChange',
  () => {},
);

const patchNodeData = (
  patch: Partial<Record<'config' | 'input' | 'ui', Record<string, unknown>>>,
) => {
  // eslint-disable-next-line vue/no-mutating-props -- nodeData is a shared reactive object mutated by all settings panels
  Object.assign(props.nodeData, patch);
};

const getNodeSection = (
  key: 'config' | 'input' | 'ui',
): Record<string, unknown> => {
  const section = props.nodeData[key];
  if (section && typeof section === 'object' && !Array.isArray(section)) {
    return section as Record<string, unknown>;
  }
  const next: Record<string, unknown> = {};
  patchNodeData({ [key]: next });
  return next;
};

const updateConfig = (name: string, value: unknown) => {
  const config = getNodeSection('config');
  config[name] = value;
  onNodeSettingsChange();
};

const updateInput = (name: string, value: unknown) => {
  const config = getNodeSection('config');
  if (value === undefined) {
    Reflect.deleteProperty(config, name);
  } else {
    config[name] = value;
  }
  onNodeSettingsChange();
};

const updateEditorHint = (name: string, value: unknown) => {
  const ui = getNodeSection('ui');
  if (!ui.editor) ui.editor = {};
  const editor = ui.editor as Record<string, unknown>;
  if (value === undefined) {
    Reflect.deleteProperty(editor, name);
  } else {
    editor[name] = value;
  }
  onNodeSettingsChange();
};

// Per-node execution overrides (retry / timeout / errorHandlingStrategy) live
// at the top level of the node, not under `config`.
const updateNodeField = (key: string, value: unknown) => {
  if (value === undefined || value === null) {
    Reflect.deleteProperty(props.nodeData, key);
  } else {
    // eslint-disable-next-line vue/no-mutating-props -- shared reactive node data
    props.nodeData[key] = value;
  }
  onNodeSettingsChange();
};

const errorHandlingOptions = computed(() =>
  manifestStore.getEnum('ErrorHandlingStrategy'),
);

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');

const inputTypeToHtml = (type: string): string => {
  const lower = type.toLowerCase();
  if (lower === 'number' || lower === 'integer' || lower === 'int')
    return 'number';
  if (lower === 'boolean' || lower === 'bool') return 'checkbox';
  return 'text';
};

const isTextarea = (field: { editorHint?: string; type: string }): boolean =>
  field.editorHint === 'textarea' ||
  field.editorHint === 'json' ||
  field.editorHint === 'expression' ||
  field.type.toLowerCase() === 'object' ||
  field.type.toLowerCase() === 'json';

const typeBadgeClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'string') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (t === 'number' || t === 'integer' || t === 'int')
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (t === 'boolean' || t === 'bool')
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  if (t === 'array') return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
  if (t === 'object' || t === 'json')
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  return 'bg-muted text-muted-foreground';
};

const activeTab = ref<'settings' | 'schema' | 'expressions' | 'variables'>(
  'settings',
);
const schemaSubTab = ref<'input' | 'output'>('input');

const hasInputSchema = computed(() => {
  if (!manifestNode.value?.examples?.length) return false;
  const inputs = manifestNode.value.config ?? [];
  return inputs.some((f) => {
    const t = f.type.toLowerCase();
    return t === 'array' || t === 'object' || t === 'json';
  });
});

const outputFields = computed(() => {
  if (
    manifestNode.value?.name === 'map' ||
    manifestNode.value?.name === 'compose'
  ) {
    const config = (props.nodeData.config ?? {}) as Record<string, unknown>;
    return Object.keys(config)
      .filter((k) => k && !k.startsWith('_'))
      .map((k) => ({ name: k, type: 'any', description: '' }));
  }
  return manifestNode.value?.output ?? [];
});

const expressionVariables = computed(
  () => manifestStore.manifest.value?.expressionVariables ?? [],
);

const expressionFunctions = computed(
  () => manifestStore.expressionFunctions.value,
);

// Authoring guidance (summary + evaluation rules) from the manifest, rendered
// as help text above the function reference. Content is manifest-provided.
const authoringExpressions = computed(
  () =>
    (manifestStore.authoring.value?.expressions ?? {}) as {
      summary?: string;
      evaluationRules?: Array<{
        title: string;
        description?: string;
        examples?: string[];
      }>;
    },
);

const fnCategories = computed(() => {
  const map = new Map<string, typeof expressionFunctions.value>();
  for (const fn of expressionFunctions.value) {
    const cat = fn.category ?? 'Other';
    const list = map.get(cat);
    if (list) list.push(fn);
    else map.set(cat, [fn]);
  }
  return map;
});

const activeFnCategory = ref('');

watch(
  fnCategories,
  (cats) => {
    if (!activeFnCategory.value && cats.size > 0) {
      activeFnCategory.value = cats.keys().next().value!;
    }
  },
  { immediate: true },
);

const filteredFunctions = computed(() => {
  return activeFnCategory.value
    ? (fnCategories.value.get(activeFnCategory.value) ?? [])
    : expressionFunctions.value;
});

function fnSignature(fn: (typeof expressionFunctions.value)[number]): string {
  const params = (fn.parameters ?? []).map((p) => {
    const opt = p.required === false ? '?' : '';
    return `${p.name}${opt}: ${p.type}`;
  });
  return `${fn.name}(${params.join(', ')})`;
}

// ─── Drag expression drop handling ────────────────────────────────
const DRAG_MIME = 'application/x-workflow-expression';

const hasExpressionData = (dt: DataTransfer): boolean => {
  for (let i = 0; i < dt.types.length; i++) {
    if (dt.types[i] === DRAG_MIME) return true;
  }
  return false;
};

const resolveDropTarget = (
  el: EventTarget | null,
): HTMLInputElement | HTMLTextAreaElement | null => {
  if (!(el instanceof HTMLElement)) return null;
  if (el.tagName === 'INPUT') return el as HTMLInputElement;
  if (el.tagName === 'TEXTAREA') return el as HTMLTextAreaElement;
  return el.closest('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
};

let lastHighlighted: HTMLElement | null = null;

const onSettingsDragOver = (event: DragEvent) => {
  if (!event.dataTransfer || !hasExpressionData(event.dataTransfer)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  const target = resolveDropTarget(event.target);
  if (target && target !== lastHighlighted) {
    lastHighlighted?.classList.remove('ring-2', 'ring-primary/50');
    target.classList.add('ring-2', 'ring-primary/50');
    lastHighlighted = target;
  }
};

const onSettingsDragLeave = (event: DragEvent) => {
  const related = event.relatedTarget as HTMLElement | null;
  if (lastHighlighted && !lastHighlighted.contains(related)) {
    lastHighlighted.classList.remove('ring-2', 'ring-primary/50');
    lastHighlighted = null;
  }
};

const onSettingsDrop = (event: DragEvent) => {
  lastHighlighted?.classList.remove('ring-2', 'ring-primary/50');
  lastHighlighted = null;

  if (!event.dataTransfer) return;
  const expr =
    event.dataTransfer.getData(DRAG_MIME) ||
    event.dataTransfer.getData('text/plain');
  if (!expr) return;
  const target = resolveDropTarget(event.target);
  if (!target) return;

  event.preventDefault();
  event.stopPropagation();

  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? start;
  const before = target.value.slice(0, start);
  const after = target.value.slice(end);
  target.value = before + expr + after;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));

  nextTick(() => {
    const pos = start + expr.length;
    target.setSelectionRange(pos, pos);
    target.focus();
  });
};
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 flex-1 flex-col"
    @dragover="onSettingsDragOver"
    @dragleave="onSettingsDragLeave"
    @drop="onSettingsDrop"
  >
    <div class="flex items-center border-b">
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="
          activeTab === 'settings'
            ? 'text-foreground border-primary border-b-2'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'settings'"
      >
        <LucideSettings2 class="h-3.5 w-3.5" />
        {{ $t('settings') }}
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="
          activeTab === 'schema'
            ? 'text-foreground border-primary border-b-2'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'schema'"
      >
        <LucideFileJson class="h-3.5 w-3.5" />
        {{ $t('node.properties.schema') }}
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="
          activeTab === 'expressions'
            ? 'text-foreground border-primary border-b-2'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'expressions'"
      >
        <LucideBraces class="h-3.5 w-3.5" />
        {{ $t('node.properties.functions') }}
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors"
        :class="
          activeTab === 'variables'
            ? 'text-foreground border-primary border-b-2'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'variables'"
      >
        <LucideVariable class="h-3.5 w-3.5" />
        {{ $t('variable', 2) }}
      </button>
    </div>

    <!-- Settings tab -->
    <div
      v-show="activeTab === 'settings'"
      class="relative min-h-0 flex-1 overflow-y-auto p-4"
      style="scrollbar-gutter: stable"
    >
      <!-- Per-node-type settings component -->
      <component
        :is="settingsComponent"
        v-if="settingsComponent"
        :node-data="nodeData"
        :node-config="nodeConfig"
        :node-input="nodeInput"
        :editor-hints="nodeEditorHints"
        :manifest-node="manifestNode"
        :update-config="updateConfig"
        :update-input="updateInput"
        :update-editor-hint="updateEditorHint"
      />

      <!-- Fallback: manifest config fields for unknown node types -->
      <template v-else-if="nodeConfigFields.length">
        <div class="space-y-3">
          <div
            v-for="field in nodeConfigFields"
            :key="field.name"
            class="space-y-1"
          >
            <label
              class="text-muted-foreground flex items-center gap-1 text-sm"
            >
              {{ prettyLabel(field.name) }}
              <span v-if="field.required" class="text-destructive">*</span>
            </label>
            <p v-if="field.description" class="text-muted-foreground text-xs">
              {{ field.description }}
            </p>
            <textarea
              v-if="isTextarea(field)"
              :value="
                typeof nodeConfig[field.name] === 'object'
                  ? JSON.stringify(nodeConfig[field.name], null, 2)
                  : String(nodeConfig[field.name] ?? field.default ?? '')
              "
              rows="3"
              :placeholder="
                field.editorHint === 'expression' ? '{{ expression }}' : ''
              "
              class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
              @input="
                updateConfig(
                  field.name,
                  ($event.target as HTMLTextAreaElement).value,
                )
              "
            />
            <div
              v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                :checked="Boolean(nodeConfig[field.name] ?? field.default)"
                class="rounded border"
                @change="
                  updateConfig(
                    field.name,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
            </div>
            <input
              v-else
              :type="inputTypeToHtml(field.type)"
              :value="nodeConfig[field.name] ?? field.default ?? ''"
              :placeholder="String(field.default ?? '')"
              class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              @input="
                updateConfig(
                  field.name,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </div>
        </div>
      </template>

      <!-- Per-node execution overrides (retry / timeout / error handling) -->
      <NodeSettingsExecution
        v-if="nodeType !== 'trigger'"
        class="mt-4"
        :node-data="nodeData"
        :error-handling-options="errorHandlingOptions"
        :default-retry="manifestStore.defaultRetryPolicy.value"
        :update="updateNodeField"
      />
    </div>

    <!-- Schema tab (combined input + output) -->
    <div
      v-show="activeTab === 'schema'"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <div v-if="hasInputSchema" class="flex gap-1 border-b px-4 pt-4 pb-2">
        <button
          type="button"
          class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors"
          :class="
            schemaSubTab === 'input'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          "
          @click="schemaSubTab = 'input'"
        >
          {{ $t('input', 1) }}
        </button>
        <button
          type="button"
          class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors"
          :class="
            schemaSubTab === 'output'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          "
          @click="schemaSubTab = 'output'"
        >
          {{ $t('node.output.title') }}
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable">
        <!-- Input schema sub-tab -->
        <div v-if="hasInputSchema && schemaSubTab === 'input'">
          <NodeSettingsInputSchema
            v-if="manifestNode"
            :manifest-node="manifestNode"
          />
        </div>
        <!-- Output schema sub-tab (or sole content when no input schema) -->
        <div v-if="!hasInputSchema || schemaSubTab === 'output'">
          <template v-if="outputFields.length">
            <div class="space-y-2">
              <div
                v-for="field in outputFields"
                :key="field.name"
                class="bg-muted/50 flex items-start gap-3 rounded-md border px-3 py-2"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ field.name }}</span>
                    <span
                      class="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
                      :class="typeBadgeClass(field.type)"
                    >
                      {{ field.type }}
                    </span>
                  </div>
                  <p
                    v-if="field.description"
                    class="text-muted-foreground mt-0.5 text-xs"
                  >
                    {{ field.description }}
                  </p>
                </div>
              </div>
            </div>
          </template>
          <div
            v-else
            class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
          >
            <LucideFileJson class="h-8 w-8 opacity-40" />
            <div>
              <p class="font-medium">{{ $t('node.no_output_schema') }}</p>
              <p class="mt-0.5 opacity-70">
                {{ $t('node.properties.no_output_schema_hint') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expressions tab -->
    <div
      v-show="activeTab === 'expressions'"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <!-- Authoring guidance (manifest-provided help text) -->
      <div
        v-if="
          authoringExpressions.summary ||
          authoringExpressions.evaluationRules?.length
        "
        class="space-y-2 border-b p-4"
      >
        <p
          v-if="authoringExpressions.summary"
          class="text-muted-foreground text-xs leading-relaxed"
        >
          {{ authoringExpressions.summary }}
        </p>
        <details
          v-for="rule in authoringExpressions.evaluationRules ?? []"
          :key="rule.title"
        >
          <summary class="text-foreground cursor-pointer text-xs font-medium">
            {{ rule.title }}
          </summary>
          <p
            v-if="rule.description"
            class="text-muted-foreground mt-1 text-[11px] leading-relaxed"
          >
            {{ rule.description }}
          </p>
          <code
            v-for="ex in rule.examples ?? []"
            :key="ex"
            class="bg-muted/70 mt-1 block rounded px-2 py-1 font-mono text-[11px]"
          >
            {{ ex }}
          </code>
        </details>
      </div>

      <!-- Category pills -->
      <div
        v-if="fnCategories.size > 1"
        class="flex gap-1 overflow-x-auto border-b px-4 pt-4 pb-2"
      >
        <button
          v-for="[cat] in fnCategories"
          :key="cat"
          type="button"
          class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors"
          :class="
            activeFnCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          "
          @click="activeFnCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Function list -->
      <div class="flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable">
        <div v-if="filteredFunctions.length" class="divide-y">
          <div
            v-for="fn in filteredFunctions"
            :key="fn.name"
            class="space-y-1.5 py-3 first:pt-0"
          >
            <!-- Signature -->
            <div class="flex items-start justify-between gap-2">
              <code class="text-xs font-semibold break-all">{{ fn.name }}</code>
              <span
                v-if="fn.returnType"
                class="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px]"
              >
                → {{ fn.returnType }}
              </span>
            </div>

            <!-- Full signature -->
            <div
              class="font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
            >
              {{ fnSignature(fn) }}
            </div>

            <!-- Description -->
            <p
              v-if="fn.description"
              class="text-muted-foreground text-xs leading-relaxed"
            >
              {{ fn.description }}
            </p>

            <!-- Parameters -->
            <div v-if="fn.parameters?.length" class="space-y-1">
              <div
                v-for="param in fn.parameters"
                :key="param.name"
                class="bg-muted/50 flex items-baseline gap-2 rounded px-2 py-1 text-[11px]"
              >
                <code class="font-semibold">{{ param.name }}</code>
                <span class="text-muted-foreground font-mono text-[10px]">
                  {{ param.type }}
                </span>
                <span
                  v-if="param.required === false"
                  class="text-muted-foreground text-[9px] italic"
                >
                  {{ $t('node.properties.optional') }}
                </span>
                <span
                  v-if="param.description"
                  class="text-muted-foreground ml-auto text-[10px]"
                >
                  {{ param.description }}
                </span>
              </div>
            </div>

            <!-- Example -->
            <div
              v-if="fn.example"
              class="bg-muted/70 rounded px-2.5 py-1.5 font-mono text-[11px]"
            >
              {{ fn.example }}
            </div>

            <!-- Aliases -->
            <div
              v-if="fn.aliases?.length"
              class="text-muted-foreground text-[10px]"
            >
              {{ $t('node.properties.aliases') }}: {{ fn.aliases.join(', ') }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
        >
          <LucideSearchX class="h-8 w-8 opacity-40" />
          <p class="font-medium">{{ $t('node.properties.no_functions') }}</p>
        </div>
      </div>
    </div>

    <!-- Variables tab -->
    <div
      v-show="activeTab === 'variables'"
      class="flex-1 overflow-y-auto p-4"
      style="scrollbar-gutter: stable"
    >
      <div v-if="expressionVariables.length" class="divide-y">
        <div
          v-for="v in expressionVariables"
          :key="v.pattern"
          class="space-y-1 py-3 first:pt-0"
        >
          <code
            class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            {{ v.pattern }}
          </code>
          <p
            v-if="v.description"
            class="text-muted-foreground text-xs leading-relaxed"
          >
            {{ v.description }}
          </p>
          <div
            v-for="ex in v.examples ?? []"
            :key="ex"
            class="bg-muted/70 rounded px-2.5 py-1.5 font-mono text-[11px]"
          >
            {{ ex }}
          </div>
        </div>
      </div>
      <div
        v-else
        class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
      >
        <LucideVariable class="h-8 w-8 opacity-40" />
        <div>
          <p class="font-medium">
            {{ $t('node.properties.no_expression_variables') }}
          </p>
          <p class="mt-0.5 opacity-70">
            {{ $t('node.properties.no_expression_variables_hint') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
