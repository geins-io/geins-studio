<script setup lang="ts">
import type { ManifestActionOutput, ManifestNodeTypeConfig } from '#shared/types'
import type { ManifestAction } from '@/composables/useWorkflowManifest'

type NodeExecution = {
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
  status?: string
} | null

const props = defineProps<{
  node: Record<string, unknown> | null
  nodeExecution?: NodeExecution
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const isOpen = computed(() => props.node !== null)

const manifestStore = useWorkflowManifest()
const { resolveIcon } = useLucideIcon()

const nodeData = computed(() => (props.node?.data ?? {}) as Record<string, unknown>)
const nodeType = computed(() => (props.node?.type ?? '') as string)
const isTriggerNode = computed(() => nodeType.value === 'trigger')

const manifestNodeType = computed(() => manifestStore.getNodeType(nodeType.value))
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (nodeType.value !== 'action') return undefined
  return manifestStore.getAction(nodeData.value.actionName as string | undefined)
})

const nodeTypeConfig = computed<ManifestNodeTypeConfig[]>(
  () => manifestNodeType.value?.config ?? [],
)

const actionInputFields = computed(() => manifestAction.value?.input ?? [])
const actionOutputFields = computed<ManifestActionOutput[]>(() => manifestAction.value?.output ?? [])

const nodeConfig = computed(() => (nodeData.value.config ?? {}) as Record<string, unknown>)
const nodeInput = computed(() => (nodeData.value.input ?? {}) as Record<string, unknown>)

const nodeIcon = computed(() => {
  const iconName = (nodeData.value.icon as string | undefined)
    ?? manifestNodeType.value?.icon
    ?? manifestAction.value?.icon
  return resolveIcon(iconName)
})

const nodeLabel = computed(() => (nodeData.value.label as string) || manifestNodeType.value?.displayName || 'Node properties')

const centerActiveTab = ref(0)

watch(isOpen, (open) => {
  if (!open) centerActiveTab.value = 0
})

const updateConfig = (name: string, value: unknown) => {
  const config = nodeConfig.value
  config[name] = value
}

const updateInput = (name: string, value: unknown) => {
  const input = nodeInput.value
  input[name] = value
}

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const inputTypeToHtml = (type: string): string => {
  const lower = type.toLowerCase()
  if (lower === 'number' || lower === 'integer' || lower === 'int') return 'number'
  if (lower === 'boolean' || lower === 'bool') return 'checkbox'
  return 'text'
}

const isTextarea = (field: { editorHint?: string, type: string }): boolean =>
  field.editorHint === 'textarea'
  || field.editorHint === 'json'
  || field.editorHint === 'expression'
  || field.type.toLowerCase() === 'object'
  || field.type.toLowerCase() === 'json'

const isSelect = (field: { allowedValues?: unknown[] }): boolean =>
  Array.isArray(field.allowedValues) && field.allowedValues.length > 0

const formatJson = (value: unknown): string => {
  if (value == null) return '–'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

const hasExecutionInput = computed(() => props.nodeExecution?.input != null)
const hasExecutionOutput = computed(() => props.nodeExecution?.output != null)
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header — full width, icon + name left, actions right -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <component :is="nodeIcon" v-if="nodeIcon" class="h-4 w-4 shrink-0" />
        <LucideSettings v-else class="h-4 w-4 shrink-0" />
        <span class="truncate text-sm font-medium">{{ nodeLabel }}</span>
        <span
          v-if="nodeExecution?.status"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
          :class="{
            'bg-green-500/10 text-green-600 dark:text-green-400': nodeExecution.status === 'completed' || nodeExecution.status === 'succeeded',
            'bg-red-500/10 text-red-600 dark:text-red-400': nodeExecution.status === 'failed',
            'bg-blue-500/10 text-blue-600 dark:text-blue-400': nodeExecution.status === 'running',
            'bg-muted text-muted-foreground': !['completed', 'succeeded', 'failed', 'running'].includes(nodeExecution.status ?? ''),
          }"
        >
          {{ nodeExecution.status }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="node && !isTriggerNode"
          class="hover:bg-destructive/10 text-destructive rounded p-1.5"
          title="Delete node"
          @click="emit('delete')"
        >
          <LucideTrash2 class="h-4 w-4" />
        </button>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="emit('close')">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- 3-column body (trigger nodes show only center) -->
    <div v-if="node" class="flex min-h-0 flex-1">
      <!-- LEFT PANE: Input data -->
      <div
        v-if="!isTriggerNode"
        class="flex w-1/4 min-w-0 flex-col border-r"
      >
        <div class="flex items-center gap-1.5 border-b px-3 py-2">
          <LucideArrowDownToLine class="text-muted-foreground h-3.5 w-3.5" />
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Input</span>
          <span
            v-if="hasExecutionInput"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500"
          />
        </div>
        <div class="flex-1 overflow-y-auto p-3" style="scrollbar-gutter: stable;">
          <!-- Schema from manifest -->
          <div v-if="actionInputFields.length" class="mb-3 space-y-1">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Schema</h4>
            <div
              v-for="field in actionInputFields"
              :key="field.name"
              class="flex items-center justify-between rounded px-1.5 py-1 text-xs"
            >
              <div class="flex items-center gap-1">
                <span class="font-mono text-[11px] font-medium">{{ field.name }}</span>
                <span v-if="field.required" class="text-destructive text-[9px]">*</span>
              </div>
              <span class="text-muted-foreground font-mono text-[10px]">{{ field.type }}</span>
            </div>
          </div>

          <!-- Node type config schema for structural nodes -->
          <div v-else-if="nodeTypeConfig.length" class="mb-3 space-y-1">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Schema</h4>
            <div
              v-for="field in nodeTypeConfig"
              :key="field.name"
              class="flex items-center justify-between rounded px-1.5 py-1 text-xs"
            >
              <div class="flex items-center gap-1">
                <span class="font-mono text-[11px] font-medium">{{ field.name }}</span>
                <span v-if="field.required" class="text-destructive text-[9px]">*</span>
              </div>
              <span class="text-muted-foreground font-mono text-[10px]">{{ field.type }}</span>
            </div>
          </div>

          <!-- Execution input data -->
          <template v-if="hasExecutionInput">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Run data</h4>
            <pre class="bg-muted overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed">{{ formatJson(nodeExecution?.input) }}</pre>
          </template>
          <div
            v-else
            class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
          >
            <LucideInbox class="h-8 w-8 opacity-40" />
            <div>
              <p class="font-medium">No input data</p>
              <p class="mt-0.5 opacity-70">Run the workflow to view input data</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER PANE: Settings / Parameters -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Center sub-tabs (Parameters | Settings) for action nodes -->
        <div v-if="nodeType === 'action' && actionInputFields.length" class="flex border-b px-2">
          <button
            v-for="(tab, i) in ['Parameters', 'Settings']"
            :key="tab"
            class="relative px-3 py-2 text-xs font-medium transition-colors"
            :class="centerActiveTab === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="centerActiveTab = i"
          >
            {{ tab }}
            <span
              v-if="centerActiveTab === i"
              class="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-full"
            />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4" style="scrollbar-gutter: stable;">
          <!-- Parameters tab (action input fields) -->
          <template v-if="centerActiveTab === 0 && nodeType === 'action' && actionInputFields.length">
            <div v-if="nodeData.actionName" class="mb-4 space-y-2">
              <label class="text-sm font-medium">Action</label>
              <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono text-xs">
                {{ nodeData.actionName }}
              </div>
            </div>

            <div class="space-y-3">
              <div v-for="field in actionInputFields" :key="field.name" class="space-y-1">
                <label class="text-muted-foreground flex items-center gap-1 text-sm">
                  {{ prettyLabel(field.name) }}
                  <span v-if="field.required" class="text-destructive">*</span>
                </label>
                <p v-if="field.description" class="text-muted-foreground text-xs">
                  {{ field.description }}
                </p>
                <select
                  v-if="isSelect(field)"
                  :value="nodeInput[field.name] ?? field.default ?? ''"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  @change="updateInput(field.name, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">
                    Select…
                  </option>
                  <option
                    v-for="opt in field.allowedValues"
                    :key="String(opt)"
                    :value="opt"
                  >
                    {{ opt }}
                  </option>
                </select>
                <textarea
                  v-else-if="isTextarea(field)"
                  :value="typeof nodeInput[field.name] === 'object' ? JSON.stringify(nodeInput[field.name], null, 2) : String(nodeInput[field.name] ?? field.default ?? '')"
                  rows="3"
                  :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
                  class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                  @input="updateInput(field.name, ($event.target as HTMLTextAreaElement).value)"
                />
                <div
                  v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
                  class="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    :checked="Boolean(nodeInput[field.name] ?? field.default)"
                    class="rounded border"
                    @change="updateInput(field.name, ($event.target as HTMLInputElement).checked)"
                  />
                </div>
                <input
                  v-else
                  :type="inputTypeToHtml(field.type)"
                  :value="nodeInput[field.name] ?? field.default ?? ''"
                  :placeholder="String(field.default ?? '')"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  @input="updateInput(field.name, ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </template>

          <!-- Settings tab (or default for non-action nodes) -->
          <template v-if="centerActiveTab === 1 || !(nodeType === 'action' && actionInputFields.length)">
            <div class="space-y-2">
              <label class="text-sm font-medium">Type</label>
              <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
                {{ manifestNodeType?.displayName ?? nodeType }}
              </div>
            </div>

            <!-- Trigger (read-only) -->
            <template v-if="isTriggerNode">
              <div class="mt-4 border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Trigger</h4>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Trigger type</span>
                    <span class="font-medium capitalize">{{ nodeData.triggerType || 'onDemand' }}</span>
                  </div>
                  <div v-if="nodeData.cronExpression" class="flex items-center justify-between gap-2">
                    <span class="text-muted-foreground">Cron</span>
                    <span class="font-mono text-xs">{{ nodeData.cronExpression }}</span>
                  </div>
                  <div
                    v-if="nodeData.eventEntity || nodeData.eventName"
                    class="flex items-center justify-between gap-2"
                  >
                    <span class="text-muted-foreground">Event</span>
                    <span class="font-medium">
                      {{ nodeData.eventEntity || nodeData.eventName }}{{ nodeData.eventAction ? ` / ${nodeData.eventAction}` : '' }}
                    </span>
                  </div>
                  <p class="text-muted-foreground border-t pt-3 text-xs">
                    Trigger configuration is managed in the General tab.
                  </p>
                </div>
              </div>
            </template>

            <!-- Action node: actionName display (when in Settings tab) -->
            <template v-if="nodeType === 'action' && centerActiveTab === 1">
              <div v-if="nodeData.actionName" class="mt-4 space-y-2">
                <label class="text-sm font-medium">Action</label>
                <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono text-xs">
                  {{ nodeData.actionName }}
                </div>
              </div>
            </template>

            <!-- Action node without manifest input fields: show params inline -->
            <template v-if="nodeType === 'action' && !actionInputFields.length">
              <div v-if="nodeData.actionName" class="mt-4 space-y-2">
                <label class="text-sm font-medium">Action</label>
                <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono text-xs">
                  {{ nodeData.actionName }}
                </div>
              </div>
            </template>

            <!-- Output schema (action nodes, Settings tab) -->
            <template v-if="nodeType === 'action' && actionOutputFields.length && centerActiveTab === 1">
              <div class="mt-4 border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">Output Schema</h4>
                <div class="space-y-1">
                  <div
                    v-for="field in actionOutputFields"
                    :key="field.name"
                    class="flex items-center justify-between rounded px-2 py-1.5 text-xs"
                  >
                    <span class="font-mono font-medium">{{ field.name }}</span>
                    <span class="text-muted-foreground font-mono">{{ field.type }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Structural node types: manifest config fields -->
            <template v-if="!isTriggerNode && nodeType !== 'action' && nodeTypeConfig.length">
              <div class="mt-4 border-t pt-4">
                <h4 class="mb-3 text-sm font-medium">
                  {{ manifestNodeType?.displayName ?? prettyLabel(nodeType) }} Settings
                </h4>
                <div class="space-y-3">
                  <div v-for="field in nodeTypeConfig" :key="field.name" class="space-y-1">
                    <label class="text-muted-foreground flex items-center gap-1 text-sm">
                      {{ prettyLabel(field.name) }}
                      <span v-if="field.required" class="text-destructive">*</span>
                    </label>
                    <p v-if="field.description" class="text-muted-foreground text-xs">
                      {{ field.description }}
                    </p>
                    <textarea
                      v-if="isTextarea(field)"
                      :value="typeof nodeConfig[field.name] === 'object' ? JSON.stringify(nodeConfig[field.name], null, 2) : String(nodeConfig[field.name] ?? field.defaultValue ?? '')"
                      rows="3"
                      :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
                      class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                      @input="updateConfig(field.name, ($event.target as HTMLTextAreaElement).value)"
                    />
                    <div
                      v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
                      class="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        :checked="Boolean(nodeConfig[field.name] ?? field.defaultValue)"
                        class="rounded border"
                        @change="updateConfig(field.name, ($event.target as HTMLInputElement).checked)"
                      />
                    </div>
                    <input
                      v-else
                      :type="inputTypeToHtml(field.type)"
                      :value="nodeConfig[field.name] ?? field.defaultValue ?? ''"
                      :placeholder="String(field.defaultValue ?? '')"
                      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      @input="updateConfig(field.name, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- RIGHT PANE: Output data -->
      <div
        v-if="!isTriggerNode"
        class="flex w-1/4 min-w-0 flex-col border-l"
      >
        <div class="flex items-center gap-1.5 border-b px-3 py-2">
          <LucideArrowUpFromLine class="text-muted-foreground h-3.5 w-3.5" />
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Output</span>
          <span
            v-if="hasExecutionOutput"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-green-500"
          />
        </div>
        <div class="flex-1 overflow-y-auto p-3" style="scrollbar-gutter: stable;">
          <!-- Output schema from manifest (action nodes) -->
          <div v-if="actionOutputFields.length" class="mb-3 space-y-1">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Schema</h4>
            <div
              v-for="field in actionOutputFields"
              :key="field.name"
              class="flex items-center justify-between rounded px-1.5 py-1 text-xs"
            >
              <span class="font-mono text-[11px] font-medium">{{ field.name }}</span>
              <span class="text-muted-foreground font-mono text-[10px]">{{ field.type }}</span>
            </div>
            <div v-if="actionOutputFields.some(f => f.description)" class="mt-1 space-y-0.5">
              <div
                v-for="field in actionOutputFields.filter(f => f.description)"
                :key="field.name"
                class="text-muted-foreground text-[10px]"
              >
                <span class="font-mono font-medium">{{ field.name }}</span>: {{ field.description }}
              </div>
            </div>
          </div>

          <!-- Execution output data -->
          <template v-if="hasExecutionOutput">
            <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Run data</h4>
            <pre class="bg-muted overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed">{{ formatJson(nodeExecution?.output) }}</pre>
          </template>
          <div
            v-else
            class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
          >
            <LucideInbox class="h-8 w-8 opacity-40" />
            <div>
              <p class="font-medium">No output data</p>
              <p class="mt-0.5 opacity-70">Run the workflow to view output data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
